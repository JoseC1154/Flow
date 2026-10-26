<!-- FILE: README.md -->
# PayPath — Annual Earnings Planner
https://josec1154.github.io/Flow/index.html

A responsive, browser-based calculator for estimating how many regular workdays and time-and-a-half overtime shifts are required to reach an annual gross earnings goal.

## How to use

Open `index.html` in a browser. Enter year-to-date gross earnings, annual gross earnings goal, base hourly pay, hours per regular workday, hours per overtime shift, and the number of overtime shifts you plan to work. Results update automatically.

## Schedule and calculations

- Business operates 24/7 with 8-hour shifts: 23:00–07:00, 07:00–15:00, and 15:00–23:00.
- Employees have five regular shifts a week. Because individual rotating workdays and assigned shifts aren't collected yet, this version **assumes Monday–Friday, 07:00–15:00** for the employee. The regular-shift count is automatically calculated to December 31 and is shown in the results, not as an editable input.
- Calendar days remaining count all days after today through December 31, including weekends. Business shift slots = remaining calendar days × 3.
- No employee can work adjacent 8-hour shifts: an 8-hour shift must be followed by at least 8 hours off. The calculator uses chronological shift slots and dynamic programming to find the maximum additional OT shifts that fit around the fixed assumed regular schedule, including across midnight. Mandatory regular shifts must also obey this rest constraint.
- Gross regular pay = remaining regular shifts × hourly rate × 8.
- OT pay per shift = hourly rate × 1.5 × 8.
- Required OT shifts = ceiling(max(0, annual goal − YTD − projected remaining regular pay) ÷ OT shift pay).
- Additional OT shifts = max(0, required OT shifts − planned OT shifts), subject to rest-rule capacity.
- If required OT shifts exceed the rest-rule capacity, the app reports that the goal is not possible under these assumptions.

## Limitations

A 24/7 operation does not mean every employee works every day. This is a planning estimate, not a verified individual roster; employees who rotate days off or work PM/midnight regular shifts may have a different feasible OT schedule. Shift opportunity is not a guarantee of assignment. The tool does not apply payroll cutoff dates, overtime law eligibility, pay premiums, taxes, paid leave, or holidays.

## Files

- `index.html` — user interface
- `styles.css` — responsive visual styling
- `app.js` — calculations and validation

## Publishing via GitHub Pages

In repository **Settings → Pages**, choose **Deploy from a branch**, select **main** and **/(root)**, and save. After publication, the app should be available at `https://josec1154.github.io/Flow/`.
