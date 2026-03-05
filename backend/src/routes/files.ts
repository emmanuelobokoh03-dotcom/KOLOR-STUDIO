import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { uploadFile, deleteFile, getSignedUrl, formatFileSize, getFileCategory } from '../services/storage';
import { logActivity } from './activities';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Allowed file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`));
    }
  },
});

// GET /api/leads/:leadId/files - Get all files for a lead
router.get('/:leadId/files', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const leadId = req.params.leadId as string;

    // Verify lead ownership
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, OR: [{ assignedToId: userId }, { assignedToId: null }] }
    });

    if (!lead) {
      res.status(404).json({ error: 'Not Found', message: 'Lead not found' });
      return;
    }

    // Get files
    const files = await prisma.file.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    });

    // Generate fresh signed URLs for each file
    const filesWithUrls = await Promise.all(
      files.map(async (file) => {
        // Extract the path from the stored URL or use filename
        const pathMatch = file.url.match(/lead-files\/([^?]+)/);
        const filePath = pathMatch ? pathMatch[1] : `${leadId}/${file.filename}`;
        
        const signedUrl = await getSignedUrl(filePath);
        
        return {
          id: file.id,
          filename: file.filename,
          originalName: file.originalName,
          mimeType: file.mimeType,
          size: file.size,
          formattedSize: formatFileSize(file.size),
          category: getFileCategory(file.mimeType),
          url: signedUrl || file.url,
          uploadedBy: file.uploadedBy,
          sharedWithClient: file.sharedWithClient,
          sharedAt: file.sharedAt,
          downloadCount: file.downloadCount,
          createdAt: file.createdAt,
        };
      })
    );

    res.json({ files: filesWithUrls });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to fetch files' });
  }
});

// POST /api/leads/:leadId/files - Upload file(s) to a lead
router.post(
  '/:leadId/files',
  authMiddleware,
  upload.array('files', 10), // Allow up to 10 files at once
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId as string;
      const leadId = req.params.leadId as string;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({ error: 'Validation Error', message: 'No files provided' });
        return;
      }

      // Verify lead ownership
      const lead = await prisma.lead.findFirst({
        where: { id: leadId, OR: [{ assignedToId: userId }, { assignedToId: null }] }
      });

      if (!lead) {
        res.status(404).json({ error: 'Not Found', message: 'Lead not found' });
        return;
      }

      const uploadedFiles = [];
      const errors = [];

      for (const file of files) {
        try {
          // Upload to Supabase Storage
          const result = await uploadFile(
            file.buffer,
            file.originalname,
            file.mimetype,
            leadId
          );

          if (!result) {
            errors.push({ filename: file.originalname, error: 'Upload failed' });
            continue;
          }

          // Save file record to database
          const dbFile = await prisma.file.create({
            data: {
              filename: result.path.split('/').pop() || file.originalname,
              originalName: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
              url: result.url,
              uploadedBy: userId,
              leadId,
            },
          });

          uploadedFiles.push({
            id: dbFile.id,
            filename: dbFile.filename,
            originalName: dbFile.originalName,
            mimeType: dbFile.mimeType,
            size: dbFile.size,
            formattedSize: formatFileSize(dbFile.size),
            category: getFileCategory(dbFile.mimeType),
            url: result.url,
            uploadedBy: dbFile.uploadedBy,
            sharedWithClient: dbFile.sharedWithClient,
            sharedAt: dbFile.sharedAt,
            downloadCount: dbFile.downloadCount,
            createdAt: dbFile.createdAt,
          });

          // Log activity
          await logActivity(
            leadId,
            userId,
            'FILE_UPLOADED',
            `Uploaded file: ${file.originalname} (${formatFileSize(file.size)})`,
            { fileId: dbFile.id, filename: file.originalname, mimeType: file.mimetype }
          );
        } catch (err) {
          console.error('File upload error:', err);
          errors.push({ filename: file.originalname, error: 'Processing failed' });
        }
      }

      if (uploadedFiles.length === 0) {
        res.status(500).json({
          error: 'Upload Failed',
          message: 'Failed to upload any files',
          errors,
        });
        return;
      }

      res.status(201).json({
        message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
        files: uploadedFiles,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      console.error('Upload files error:', error);
      res.status(500).json({ error: 'Server Error', message: 'Failed to upload files' });
    }
  }
);

// DELETE /api/files/:fileId - Delete a file
router.delete('/:fileId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const fileId = req.params.fileId as string;

    // Get file with lead info
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        lead: {
          select: { assignedToId: true, id: true }
        }
      }
    });

    if (!file) {
      res.status(404).json({ error: 'Not Found', message: 'File not found' });
      return;
    }

    // Verify lead ownership
    if (file.lead.assignedToId !== userId) {
      res.status(403).json({ error: 'Forbidden', message: 'You can only delete files from your own leads' });
      return;
    }

    // Delete from Supabase Storage
    const pathMatch = file.url.match(/lead-files\/([^?]+)/);
    const filePath = pathMatch ? pathMatch[1] : `${file.leadId}/${file.filename}`;
    
    const deleted = await deleteFile(filePath);
    if (!deleted) {
      console.warn('Failed to delete file from storage, but continuing with database cleanup');
    }

    // Delete from database
    await prisma.file.delete({ where: { id: fileId } });

    // Log activity
    await logActivity(
      file.lead.id,
      userId,
      'FILE_DELETED',
      `Deleted file: ${file.originalName}`,
      { deletedFileId: fileId, filename: file.originalName }
    );

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to delete file' });
  }
});

// GET /api/files/:fileId/download - Get download URL for a file
router.get('/:fileId/download', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const fileId = req.params.fileId as string;

    // Get file with lead info
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        lead: {
          select: { assignedToId: true }
        }
      }
    });

    if (!file) {
      res.status(404).json({ error: 'Not Found', message: 'File not found' });
      return;
    }

    // Verify lead ownership
    if (file.lead.assignedToId !== userId) {
      res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
      return;
    }

    // Get fresh signed URL
    const pathMatch = file.url.match(/lead-files\/([^?]+)/);
    const filePath = pathMatch ? pathMatch[1] : `${file.leadId}/${file.filename}`;
    
    const signedUrl = await getSignedUrl(filePath);
    
    if (!signedUrl) {
      res.status(500).json({ error: 'Server Error', message: 'Failed to generate download URL' });
      return;
    }

    res.json({ url: signedUrl, filename: file.originalName });
  } catch (error) {
    console.error('Download URL error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to get download URL' });
  }
});

// PATCH /api/files/:fileId/share - Toggle share with client
router.patch('/:fileId/share', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const fileId = req.params.fileId as string;
    const { shared } = req.body;

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: { lead: { select: { assignedToId: true } } }
    });

    if (!file) {
      res.status(404).json({ error: 'Not Found', message: 'File not found' });
      return;
    }

    // Verify ownership: user must own the lead (directly assigned or unassigned)
    if (file.lead.assignedToId && file.lead.assignedToId !== userId) {
      res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
      return;
    }

    const updated = await prisma.file.update({
      where: { id: fileId },
      data: {
        sharedWithClient: !!shared,
        sharedAt: shared ? new Date() : null
      }
    });

    res.json({
      file: {
        id: updated.id,
        sharedWithClient: updated.sharedWithClient,
        sharedAt: updated.sharedAt,
      }
    });
  } catch (error) {
    console.error('Share file error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to update sharing status' });
  }
});

// PATCH /api/files/:fileId/track-download - Track download
router.patch('/:fileId/track-download', async (req: Request, res: Response): Promise<void> => {
  try {
    const fileId = req.params.fileId as string;

    await prisma.file.update({
      where: { id: fileId },
      data: {
        downloadCount: { increment: 1 },
        lastDownloadedAt: new Date()
      }
    });

    res.json({ message: 'Download tracked' });
  } catch (error) {
    console.error('Track download error:', error);
    res.status(500).json({ error: 'Server Error', message: 'Failed to track download' });
  }
});

export default router;
