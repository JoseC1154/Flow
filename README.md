<!-- FILE: README.md -->
# PayPath — Annual Earnings Planner
https://josec1154.github.io/Flow/index.html

A responsive, browser-based calculator for estimating how many regular workdays and time-and-a-half overtime shifts are required to reach an annual gross earnings goal.

## How to use

Open `index.html` in a browser. Enter year-to-date gross earnings, annual gross earnings goal, base hourly pay, hours per regular workday, hours per overtime shift, and the number of overtime shifts you plan to work. Results update automatically.

## Schedule and calculations

The operation is open seven days per week, with shifts at 23:00–07:00, 07:00–15:00, and 15:00–23:00.

- The employee is guaranteed five eight-hour regular shifts each week. Until actual rotation inputs are added, the remaining regular count is estimated from Monday–Friday dates after today through December 31.
- All calendar days after today through December 31 contribute three *business* shift slots.
- **Illustrative midnight + late-clear scenario:** One 23:00–07:00 midnight report and its immediately following 07:00–15:00 late clear can be worked consecutively. The 15:00–23:00 shift is then off, providing the required 8-hour break before the next midnight report. Three consecutive shifts are not allowed.
- The midnight shift is regular on a guaranteed workday and overtime on an employee day off. The late clear is overtime on both kinds of days.
- **Potential OT shifts = days off × 1 midnight OT shift + calendar days × 1 late-clear OT shift.** With 66 calendar days and 48 regular days: 18 overtime midnight shifts plus 66 overtime late clears = **84 possible OT shifts** (18 of those late clears occur on the 18 days off, so each day off can contain two OT shifts).
- Gross regular pay = remaining regular shifts × hourly rate × 8.
- OT pay per shift = hourly rate × 1.5 × 8.
- OT shifts required = ceiling(max(0, annual goal − YTD − remaining regular pay) ÷ OT pay per shift).
- Additional OT shifts needed = max(0, OT shifts required − planned OT shifts). The required number remains visible even when it exceeds illustrated capacity.

## Limitations

A 24/7 operation does not mean every employee works every day. This scenario is a planning illustration, not a verified roster. Because midnight shifts cross dates, exact assigned rotations and start/end-of-year boundaries can change the achievable shift count. Employee rules may prohibit certain doubles or require longer recovery time. Shift opportunity is not a guarantee of assignment. The tool does not apply payroll cutoff dates, overtime law eligibility, pay premiums, taxes, paid leave, or holidays.

## Files

- `index.html` — user interface
- `styles.css` — responsive visual styling
- `app.js` — calculations and validation

## Publishing via GitHub Pages

In repository **Settings → Pages**, choose **Deploy from a branch**, select **main** and **/(root)**, and save. After publication, the app should be available at `https://josec1154.github.io/Flow/`.
