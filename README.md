<!-- FILE: README.md -->
# PayPath — Annual Earnings Planner
https://josec1154.github.io/Flow/index.html

A responsive, browser-based calculator for estimating how many regular workdays and time-and-a-half overtime shifts are required to reach an annual gross earnings goal.

## How to use

Open `index.html` in a browser. Choose **Automatic (today)** or **Choose a date** for the as-of calculation date. The custom date uses the selected date's calendar year, with remaining shifts counted starting the next day through December 31. Enter year-to-date gross earnings, annual gross earnings goal, base hourly pay, hours per regular workday, hours per overtime shift, and the number of overtime shifts you plan to work. Results update automatically.

## Planned overtime entry

Choose **Total through year-end** to enter the entire planned overtime tour count, or **Per week** to enter a weekly tour count. Weekly entry converts to a year-end total using `floor(OT tours per week × remaining calendar days / 7)`. Partial weeks are prorated and fractional tours are rounded down. Both modes cap the planned total at the existing estimated available OT capacity. The converted planned total is shown in the earnings breakdown and used in the year-end gross projection and remaining OT requirement.

## Estimated year-end earnings

The prominent **Estimated year-end gross earnings** result updates immediately when the user changes YTD pay, hourly rate, planned overtime shifts, or the automatic/custom as-of date. It equals YTD gross earnings + estimated pay from remaining guaranteed regular shifts + pay for planned overtime shifts (limited to the modeled OT capacity). The breakdown shows all three components and the amount above or below the user's annual earnings goal. This is gross pay before taxes.

## Schedule and calculations

The operation is open seven days per week, with shifts at 23:00–07:00, 07:00–15:00, and 15:00–23:00.

- The employee is guaranteed five eight-hour regular shifts each week. Until actual rotation inputs are added, the remaining regular count is estimated from Monday–Friday dates after today through December 31.
- The selected automatic/custom as-of date controls **all** remaining-calendar-day, guaranteed regular-shift, available OT-shift, and projected-pay calculations. Every day after the chosen as-of date through December 31 contributes three *business* shift slots, including weekends. Automatic mode uses today's local device date; Custom mode allows a manually selected date. The as-of date itself is excluded because YTD is assumed to include that day's earnings. The results show the selected date and its exact remaining date range.
- **Tour-neutral maximum OT estimate:** Each remaining calendar day can accommodate up to two 8-hour tours, with no third consecutive tour. The five guaranteed regular tours each week occupy one of those potential tours, whatever assigned tour the employee works.
- **Only one of the two regular days off may be worked in a Monday–Sunday week.** The app groups remaining off-days by week and counts at most one eligible day off in each week (including partial weeks). That day can have up to two 8-hour OT tours, subject to the no-three-consecutive-tours assumption.
- **Estimated OT capacity = guaranteed regular tours + 2 × eligible worked days off.** Example: October 27–December 31, 2026 has 66 calendar days, 48 estimated regular tours and 18 days off across 9 eligible workweeks. At most 9 days off can be worked (18 day-off OT tours); adding 48 potential regular-day OT tours yields **66 possible OT tours**. The unworked day off each week is not an OT opportunity.
- The guaranteed regular count is approximated with Monday–Friday dates solely for counting five per week; this does **not** assume a Monday–Friday employee schedule or a particular report time. Rotating rosters, overnight shift boundaries, and rest intervals may reduce actual capacity.
- Gross regular pay = remaining regular shifts × hourly rate × 8.
- OT pay per shift = hourly rate × 1.5 × 8.
- OT shifts required = ceiling(max(0, annual goal − YTD − remaining regular pay) ÷ OT pay per shift).
- Additional OT shifts needed = max(0, OT shifts required − planned OT shifts). The required number remains visible even when it exceeds illustrated capacity.

## Limitations

A 24/7 operation does not mean every employee works every day. This is an upper-bound planning estimate, not a verified roster. Because midnight shifts cross dates, exact assigned rotations and start/end-of-year boundaries can change the achievable shift count. Employee rules may prohibit certain doubles or require longer recovery time. Shift opportunity is not a guarantee of assignment. The tool does not apply payroll cutoff dates, overtime law eligibility, pay premiums, taxes, paid leave, or holidays.

## UI design rules for contributors and AI agents

See [AGENTS.md](AGENTS.md) before modifying controls or calculations. All dropdowns must use the shared PayPath theme, all editable number inputs use mint +/- stepper buttons instead of dark browser-default spinners, and date-picker icons must be clearly visible. Check keyboard access, contrast, mobile layout, and cache-busting of changed assets.

## Files

- `index.html` — user interface
- `styles.css` — responsive visual styling
- `app.js` — calculations and validation, plus shared number-stepper behavior
- `AGENTS.md` — persistent requirements for future AI agents

## Publishing via GitHub Pages

In repository **Settings → Pages**, choose **Deploy from a branch**, select **main** and **/(root)**, and save. After publication, the app should be available at `https://josec1154.github.io/Flow/`.
