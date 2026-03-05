#!/usr/bin/env python3
"""Replace hardcoded violet/fuchsia/purple Tailwind classes with brand-aware classes."""
import re
import glob
import sys

def get_brand_replacement(color_family, shade_str, opacity=None):
    """Map color-shade to brand equivalent."""
    shade = int(shade_str)
    
    if color_family in ('violet', 'purple'):
        prefix = 'brand-primary'
    elif color_family == 'fuchsia':
        prefix = 'brand-accent'
    else:
        return None

    # Map shade to variant
    if shade <= 50:
        variant = prefix
        default_opacity = '/5'
    elif shade <= 100:
        variant = prefix
        default_opacity = '/10'
    elif shade <= 200:
        variant = prefix
        default_opacity = '/20'
    elif shade <= 400:
        variant = f'{prefix}-light'
        default_opacity = None
    elif shade <= 600:
        variant = prefix
        default_opacity = None
    else:  # 700+
        variant = f'{prefix}-dark'
        default_opacity = None

    # If explicit opacity, always use it
    if opacity:
        return f'{variant}{opacity}'
    # For very light shades, use default opacity
    elif default_opacity and shade <= 200:
        return f'{variant}{default_opacity}'
    else:
        return variant

# Tailwind utility prefixes that accept colors
PREFIXES = (
    'bg', 'text', 'border', 'border-l', 'border-r', 'border-t', 'border-b',
    'border-x', 'border-y', 'ring', 'ring-offset', 'from', 'to', 'via',
    'shadow', 'divide', 'outline', 'decoration', 'placeholder', 'accent',
    'caret', 'fill', 'stroke',
)

# Build regex: match any utility prefix followed by color-shade(/opacity)?
prefix_pattern = '|'.join(re.escape(p) for p in sorted(PREFIXES, key=len, reverse=True))
pattern = re.compile(
    rf'({prefix_pattern})'
    r'-(violet|fuchsia|purple)'
    r'-(\d+)'
    r'(/\d+)?'
)

def replace_match(match):
    prefix = match.group(1)
    color = match.group(2)
    shade = match.group(3)
    opacity = match.group(4) or ''
    
    replacement = get_brand_replacement(color, shade, opacity)
    if replacement:
        return f'{prefix}-{replacement}'
    return match.group(0)

src_dir = '/app/kolor-studio-v2/frontend/src'
files = (
    glob.glob(f'{src_dir}/**/*.tsx', recursive=True) +
    glob.glob(f'{src_dir}/**/*.ts', recursive=True) +
    glob.glob(f'{src_dir}/**/*.css', recursive=True)
)

total_replacements = 0
for filepath in sorted(files):
    with open(filepath, 'r') as f:
        content = f.read()
    
    new_content, count = pattern.subn(replace_match, content)
    
    if count > 0:
        with open(filepath, 'w') as f:
            f.write(new_content)
        total_replacements += count
        print(f'  [{count:3d}] {filepath.replace(src_dir + "/", "")}')

print(f'\nTotal replacements: {total_replacements}')
