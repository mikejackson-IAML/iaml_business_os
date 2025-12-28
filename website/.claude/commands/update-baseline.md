# Update Visual Baseline Command

Update visual regression baseline screenshots for a specific page after you've finished designing it.

## Usage

```
/update-baseline <page-name> [viewport]
```

**Arguments:**
- `page-name` (required): The page to update (e.g., `about-us`, `featured-programs`, `corporate-training`, `faculty`, `program-schedule`)
- `viewport` (optional): Specific viewport to update (`mobile`, `tablet`, or `desktop`). If omitted, updates all viewports.

**Examples:**
```
/update-baseline about-us              # Updates all 3 viewports
/update-baseline about-us mobile       # Updates only mobile
/update-baseline faculty desktop       # Updates only desktop
/update-baseline "Benefit cards"       # Updates a component baseline
```

## Available Pages

| Page Name | Description |
|-----------|-------------|
| `homepage` | Homepage |
| `about-us` | About Us page |
| `featured-programs` | Featured Programs page |
| `corporate-training` | Corporate Training page |
| `faculty` | Faculty page |
| `program-schedule` | Program Schedule page |
| `program-employee-relations-law` | Employee Relations Law program |
| `program-strategic-hr-leadership` | Strategic HR Leadership program |

## Available Components

| Component Name | Description |
|----------------|-------------|
| `Header` | Header component (all states) |
| `Footer` | Footer component |
| `Glass buttons` | Glass button styles |
| `Benefit cards` | Benefit card component |

## Execution Steps

1. **Parse the arguments** from $ARGUMENTS
   - Extract page name (first argument)
   - Extract viewport if provided (second argument)

2. **Build the grep pattern**:
   - If viewport specified: `"<page-name> - <viewport>"` (e.g., `"about-us - mobile"`)
   - If no viewport: `"<page-name>"` (matches all viewports for that page)

3. **Run the Playwright command**:
   ```bash
   npx playwright test visual-regression --update-snapshots --grep "<pattern>"
   ```

4. **Report results**:
   - List which baseline files were updated
   - Show the path to the updated screenshots

## Output

Display:
```
Updating baseline for: <page-name> [viewport]
================================================

Running: npx playwright test visual-regression --update-snapshots --grep "<pattern>"

[Playwright output]

Baselines updated:
- qa/tests/__screenshots__/visual-regression.spec.js/<page-name>-mobile.png
- qa/tests/__screenshots__/visual-regression.spec.js/<page-name>-tablet.png
- qa/tests/__screenshots__/visual-regression.spec.js/<page-name>-desktop.png

Remember to commit these updated baselines with your code changes.
```

## Notes

- Always visually verify the page looks correct in your browser before updating baselines
- Updated baselines should be committed along with the code changes that caused them
- If no tests match the grep pattern, Playwright will report "No tests found"
