# Laptop Login and Provided Detection Image

## Login page

- Redesign the sign-in screen for laptops as a balanced split layout: a large onion field image and OnionGrade identity on one side, with a clean, wider authentication panel on the other.
- Keep the current compact, full-height design on phones and introduce fluid tablet/laptop sizing so fields, spacing, and actions remain aligned at common screen widths.
- Preserve login, signup, email verification, password recovery, Google sign-in, and all current form behavior.
- Correct the current sign-in page hydration mismatch while updating its responsive structure.

## Report image

- Remove the generated onion detection asset from report views.
- Store and display the user-provided onion image through the project asset flow.
- Remove the extra programmatic detection overlays because the provided image already includes its own Grade A, URS, damaged, sprouted, and rotten boxes and labels.
- Keep the existing report ratings, quality bars, metrics, defects, farmer details, and PDF actions unchanged.

## Verification

- Check the sign-in page at phone, tablet, and laptop widths.
- Check that report views show only the provided detection image, without duplicate boxes.
- Confirm authentication controls still work and no browser errors remain.

## Technical details

- Update the authentication route’s responsive layout and semantic styling without changing authentication logic.
- Add the uploaded image as a managed asset pointer and update the shared report view to use it.
- Validate the affected routes with focused type and browser checks.
