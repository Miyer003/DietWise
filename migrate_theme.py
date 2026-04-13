import re

files = [
    'src/screens/Analytics/AnalyticsScreen.tsx',
    'src/screens/Analytics/HistoryView.tsx',
    'src/screens/MealPlan/MealPlanScreen.tsx',
]

def migrate_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Replace import
    content = content.replace(
        "import Colors from '../../constants/Colors';",
        "import { Theme } from '../../constants/Theme';"
    )

    # 2. Replace shadow blocks BEFORE Colors replacement so regex matches both quoted and unquoted colors
    shadow_pattern = re.compile(
        r"shadowColor:\s*(?:['\"][^'\"]*['\"]|[A-Za-z_.]+),\s*\n"
        r"\s*shadowOffset:\s*\{\s*width:\s*\d+,\s*height:\s*\d+\s*\},\s*\n"
        r"\s*shadowOpacity:\s*[\d.]+,\s*\n"
        r"\s*shadowRadius:\s*\d+,\s*\n"
        r"\s*elevation:\s*\d+,?",
        re.MULTILINE
    )
    
    def replace_shadow(match):
        text = match.group(0)
        # Check for custom colored button shadows
        if re.search(r'shadowColor:\s*(?:Colors|Theme\.colors)\.(warning|primary)', text):
            elevation_match = re.search(r'elevation:\s*(\d+)', text)
            elevation = int(elevation_match.group(1)) if elevation_match else 0
            if elevation >= 4:
                return '...Theme.shadows.cardPressed'
            return '...Theme.shadows.card'
        
        elevation_match = re.search(r'elevation:\s*(\d+)', text)
        elevation = int(elevation_match.group(1)) if elevation_match else 0
        
        opacity_match = re.search(r'shadowOpacity:\s*([\d.]+)', text)
        opacity = float(opacity_match.group(1)) if opacity_match else 0
        
        offset_match = re.search(r'shadowOffset:\s*\{\s*width:\s*\d+,\s*height:\s*(\d+)\s*\}', text)
        offset_y = int(offset_match.group(1)) if offset_match else 0
        
        if elevation == 0:
            return '...Theme.shadows.none'
        elif opacity > 0.2 or offset_y >= 3:
            return '...Theme.shadows.cardPressed'
        elif offset_y == -2:
            return '...Theme.shadows.tabBar'
        elif elevation == 1:
            return '...Theme.shadows.button'
        elif elevation == 2:
            return '...Theme.shadows.card'
        elif elevation == 3:
            return '...Theme.shadows.cardSelected'
        elif elevation >= 4:
            return '...Theme.shadows.cardPressed'
        else:
            return '...Theme.shadows.card'
    
    content = shadow_pattern.sub(replace_shadow, content)

    # 3. Replace Colors. with Theme.colors.
    content = content.replace('Colors.', 'Theme.colors.')

    # 4. Replace borderRadius values
    def replace_border_radius(match):
        val = int(match.group(1))
        mapping = {20: 'Theme.radius.xl', 16: 'Theme.radius.lg', 12: 'Theme.radius.md',
                   10: 'Theme.radius.sm', 8: 'Theme.radius.xs', 4: 'Theme.radius.xxs'}
        if val in mapping:
            return f'borderRadius: {mapping[val]}'
        return match.group(0)
    content = re.sub(r'borderRadius:\s*(\d+)', replace_border_radius, content)

    # 5. Replace padding/margin spacing values
    spacing_props = ['padding', 'paddingHorizontal', 'paddingVertical', 'paddingTop', 'paddingBottom',
                     'paddingLeft', 'paddingRight', 'margin', 'marginHorizontal', 'marginVertical',
                     'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'gap']
    
    spacing_mapping = {20: 'Theme.spacing.page', 16: 'Theme.spacing.lg', 15: 'Theme.spacing.content',
                       12: 'Theme.spacing.md', 10: 'Theme.spacing.compact', 8: 'Theme.spacing.sm'}
    
    for prop in spacing_props:
        def replace_spacing(match):
            val = int(match.group(1))
            if val in spacing_mapping:
                return f'{prop}: {spacing_mapping[val]}'
            return match.group(0)
        content = re.sub(rf'{prop}:\s*(\d+)', replace_spacing, content)

    # 6. Replace fontSize with typography tokens
    font_size_mapping = {
        22: 'Theme.typography.sizes.h1',
        20: 'Theme.typography.sizes.h1',
        18: 'Theme.typography.sizes.h1',
        17: 'Theme.typography.sizes.h2',
        16: 'Theme.typography.sizes.h2',
        15: 'Theme.typography.sizes.body',
        14: 'Theme.typography.sizes.caption',
        13: 'Theme.typography.sizes.caption',
        12: 'Theme.typography.sizes.small',
        11: 'Theme.typography.sizes.small',
        10: 'Theme.typography.sizes.tiny',
    }
    
    def replace_font_size(match):
        val = int(match.group(1))
        if val in font_size_mapping:
            return f'fontSize: {font_size_mapping[val]}'
        return match.group(0)
    content = re.sub(r'fontSize:\s*(\d+)', replace_font_size, content)

    # 6b. Replace fontWeight string literals
    fw_mapping = {
        "'bold'": 'Theme.typography.weights.bold',
        '"bold"': 'Theme.typography.weights.bold',
        "'700'": 'Theme.typography.weights.bold',
        '"700"': 'Theme.typography.weights.bold',
        "'600'": 'Theme.typography.weights.semibold',
        '"600"': 'Theme.typography.weights.semibold',
        "'500'": 'Theme.typography.weights.medium',
        '"500"': 'Theme.typography.weights.medium',
        "'400'": 'Theme.typography.weights.regular',
        '"400"': 'Theme.typography.weights.regular',
        "'300'": 'Theme.typography.weights.light',
        '"300"': 'Theme.typography.weights.light',
    }
    for old, new in fw_mapping.items():
        content = content.replace(f'fontWeight: {old}', f'fontWeight: {new}')

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Migrated {path}')

for f in files:
    migrate_file(f)
