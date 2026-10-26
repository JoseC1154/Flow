// FILE: app.js
"use strict";
const el = (id) => document.getElementById(id);
const money = (value) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(value);
const whole = (value) => new Intl.NumberFormat("en-US").format(value);
const dateNow = () => new Date();
function daysUntilYearEnd(today){
  return Math.max(0,Math.round((Date.UTC(today.getFullYear(),11,31)-Date.UTC(today.getFullYear(),today.getMonth(),today.getDate()))/86400000));
}
function remainingSchedule(today){
  const calendarDays=daysUntilYearEnd(today);
  let regular=0;
  const eligibleDaysOffWeeks=new Set();
  const end=new Date(today.getFullYear(),11,31);
  for(let date=new Date(today.getFullYear(),today.getMonth(),today.getDate()+1);
      date<=end;date.setDate(date.getDate()+1)){
    if(date.getDay()!==0&&date.getDay()!==6){
      regular++;
    }else{
      // Monday–Sunday week key: at most one of the two days off may be worked.
      const weekStart=new Date(date.getFullYear(),date.getMonth(),date.getDate());
      weekStart.setDate(weekStart.getDate()-(weekStart.getDay()+6)%7);
      eligibleDaysOffWeeks.add(`${weekStart.getFullYear()}-${weekStart.getMonth()+1}-${weekStart.getDate()}`);
    }
  }
  // Tour-neutral upper bound: at most two 8-hour tours per calendar day.
  // Every regular tour occupies one slot. Five regular tours per week are
  // approximated by weekday count; actual rotating days off may differ.
  // Two consecutive tours are permitted, but never a third consecutive tour.
  const daysOff=calendarDays-regular;
  const regularDayOT=regular;
  // One day-off shift opportunity per calendar workweek, up to two OT tours.
  const workedDaysOff=Math.min(daysOff,eligibleDaysOffWeeks.size);
  const dayOffOT=workedDaysOff*2;
  const maxOT=regularDayOT+dayOffOT;
  return {regular,daysOff,workedDaysOff,regularDayOT,dayOffOT,slots:calendarDays*3,maxOT};
}
function selectedAsOfDate(){
  if(el("dateMode").value!=="custom") return dateNow();
  const value=el("customDate").value;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year,month,day]=value.split("-").map(Number);
  const parsed=new Date(year,month-1,day);
  if(parsed.getFullYear()!==year||parsed.getMonth()!==month-1||parsed.getDate()!==day) return null;
  return parsed;
}
function updateDateMode(){
  const custom=el("dateMode").value==="custom";
  el("customDateField").hidden=!custom;
  el("customDateField").style.display=custom?"":"none";
  el("customDate").disabled=!custom;
  el("dateModeExplanation").textContent=custom?"Using the selected date.":"Using today's date automatically.";
  if(custom&&!el("customDate").value){
    const now=dateNow();
    const pad=(n)=>String(n).padStart(2,"0");
    el("customDate").value=`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  }
  calculate();
}
function calculate(){
  const ids=["ytd","goal","rate","hours","otHours","otDays"];
  const n=Object.fromEntries(ids.map(id=>[id,Number(el(id).value)]));
  const error=el("error");
  if(ids.some(id=>el(id).value.trim()===""||!Number.isFinite(n[id]))||
    n.ytd<0||n.goal<=0||n.rate<=0||n.hours!==8||n.otHours!==8||
    n.otDays<0||!Number.isInteger(n.otDays)){
    error.hidden=false;
    error.textContent="Enter valid earnings, 8-hour shifts, and a whole number of planned overtime shifts.";
    return;
  }
  error.hidden=true;
  const today=selectedAsOfDate();
  if(!today){
    error.hidden=false;
    error.textContent="Please select a valid calculation date.";
    return;
  }
  const calendarDays=daysUntilYearEnd(today);
  const schedule=remainingSchedule(today);
  const vacationEnabled=el("vacationMode").value==="include";
  const vacationInput=el("vacationWeeks");
  const vacationWeeks=vacationEnabled?Number(vacationInput.value):0;
  if(vacationEnabled&&(vacationInput.value.trim()===""||!Number.isInteger(vacationWeeks)||vacationWeeks<0||vacationWeeks>Math.ceil(calendarDays/7))){
    error.hidden=false;
    error.textContent="Enter a whole number of vacation weeks within the remaining date range.";
    return;
  }
  // Each full vacation week removes up to 5 regular-day OT tours and
  // 2 day-off OT tours. The exact roster is unknown, so this is an estimate.
  const effectiveOTWeeks=Math.max(0,calendarDays/7-vacationWeeks);
  const vacationOTLoss=Math.min(schedule.maxOT,7*vacationWeeks);
  const availableOT=Math.max(0,schedule.maxOT-vacationOTLoss);
  const regularPay=n.rate*8;
  const overtimePay=n.rate*1.5*8;
  const remaining=Math.max(0,n.goal-n.ytd);
  const gap=Math.max(0,remaining-schedule.regular*regularPay);
  const neededOT=gap<=0?0:Math.ceil((gap-0.0000001)/overtimePay);
  // Weekly plans are prorated over the exact remaining calendar days.
  // Round down to whole tours; never count a partial tour as worked.
  const weeklyMode=el("otMode").value==="weekly";
  const requestedOT=weeklyMode?Math.floor((n.otDays*effectiveOTWeeks)+1e-9):n.otDays;
  const plannedShifts=Math.min(requestedOT,availableOT);
  const additionalOT=Math.max(0,neededOT-plannedShifts);
  const achievable=neededOT<=availableOT;
  const forecast=n.ytd+schedule.regular*regularPay+plannedShifts*overtimePay;
  const percent=Math.min(100,n.ytd/n.goal*100);
  const startText=today.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
  const endText=`Dec 31, ${today.getFullYear()}`;
  const modeText=el("dateMode").value==="custom"?"Custom date":"Automatic date";
  el("dateLabel").textContent=`${modeText}: ${startText}`;
  el("forecastRange").textContent=`Calculations cover ${whole(calendarDays)} calendar days after ${startText} through ${endText} (including weekends).`;
  el("remainingDaysLabel").textContent=`Calendar days remaining (24/7) from ${startText}`;
  el("remainingWeeksLabel").textContent=`Calendar weeks left from ${startText}`;
  el("percent").textContent=`${percent.toFixed(1)}% achieved`;
  el("progress").style.width=`${percent}%`;
  el("remaining").textContent=money(remaining);
  el("weeks").textContent=(calendarDays/7).toFixed(1);
  el("weekdays").textContent=whole(calendarDays);
  el("shiftSlots").textContent=whole(schedule.slots);
  el("otCapacity").textContent=whole(availableOT);
  el("otWeeksAvailable").textContent=effectiveOTWeeks.toFixed(1);
  el("vacationWeeksExcluded").textContent=whole(vacationWeeks);
  el("daysOff").textContent=whole(schedule.dayOffOT);
  el("lateClears").textContent=whole(schedule.regularDayOT);
  el("dayPay").textContent=money(regularPay);
  el("otPay").textContent=money(overtimePay);
  // Always show required OT as a number; feasibility is explained separately.
  el("minimumOT").textContent=whole(additionalOT);
  el("requiredRegular").textContent=whole(schedule.regular);
  el("yearEndTotal").textContent=money(forecast);
  el("ytdBreakdown").textContent=money(n.ytd);
  el("regularEarnings").textContent=money(schedule.regular*regularPay);
  el("projected").textContent=money(forecast);
  const difference=forecast-n.goal;
  el("goalDifference").textContent=(difference>=0?"+":"−")+money(Math.abs(difference));
  el("gap").textContent=money(gap);
  el("plannedEarnings").textContent=money(plannedShifts*overtimePay);
  el("plannedOTTotal").textContent=whole(plannedShifts);
  let message;
  if(remaining===0)message="You've already reached your annual goal.";
  else if(calendarDays===0)message="No calendar days remain this year.";
  else if(!achievable)message=`Your earnings goal needs ${whole(neededOT)} overtime tours (${whole(additionalOT)} beyond ${whole(plannedShifts)} planned), but the estimated OT capacity is ${whole(availableOT)} after excluding ${whole(vacationWeeks)} vacation weeks. Estimated shortfall at full OT capacity: ${money(Math.max(0,gap-availableOT*overtimePay))}.`;
  else if(additionalOT===0)message=neededOT===0?"Your projected regular tours alone meet the goal.":"Your planned overtime covers the additional tours required for your goal.";
  else message=`With ${whole(schedule.regular)} guaranteed regular tours across ${whole(calendarDays)} remaining calendar days, the upper-bound estimate is ${whole(availableOT)} possible OT tours after vacation adjustments. Your ${whole(plannedShifts)} planned OT tours count toward ${whole(neededOT)} needed, leaving ${whole(additionalOT)} more. Only one regular day off per week may be worked; no specific regular tour is assumed.`;
  if(requestedOT>availableOT)message+=" Planned overtime was capped at the estimated available OT capacity.";
  if(weeklyMode)message+=` Weekly plan: ${whole(n.otDays)} tours/week × ${effectiveOTWeeks.toFixed(2)} OT-eligible weeks = ${whole(requestedOT)} whole tours before applying the capacity limit.`;
  if(vacationEnabled)message+=` No overtime is counted during ${whole(vacationWeeks)} vacation weeks; regular pay assumes paid vacation.`;
  el("guidance").textContent=message;
}
// Accessible, theme-matched +/- controls for editable numeric inputs.
function updateVacationMode(){
  const included=el("vacationMode").value==="include";
  el("vacationWeeksField").hidden=!included;
  el("vacationWeeksField").style.display=included?"":"none";
  el("vacationWeeks").disabled=!included;
  el("vacationExplanation").textContent=included
    ?"Vacation weeks reduce overtime availability and weekly planned OT. No OT during vacation. Regular earnings assume paid vacation."
    :"Vacation is excluded from the forecast; no overtime is deducted for vacation. You can include it above.";
  calculate();
}
function installNumberSteppers(){
  document.querySelectorAll('.input input[type="number"]:not([readonly])').forEach(input=>{
    const controls=document.createElement("span");
    controls.className="number-stepper";
    for(const [sign,direction] of [["−",-1],["+",1]]){
      const button=document.createElement("button");
      button.type="button";
      button.className="stepper-button";
      button.textContent=sign;
      button.setAttribute("aria-label",`${direction>0?"Increase":"Decrease"} ${input.closest("label")?.textContent.trim()||"value"}`);
      button.addEventListener("click",()=>{
        const step=Number(input.step)||1;
        const base=Number(input.value)||0;
        const min=input.min===""?-Infinity:Number(input.min);
        const max=input.max===""?Infinity:Number(input.max);
        const precision=(String(step).split(".")[1]||"").length;
        const candidate=Math.min(max,Math.max(min,Number((base+direction*step).toFixed(precision))));
        if(candidate!==base){
          input.value=String(candidate);
          input.dispatchEvent(new Event("input",{bubbles:true}));
        }
      });
      controls.appendChild(button);
    }
    input.parentElement.appendChild(controls);
  });
}
installNumberSteppers();
el("calculator").addEventListener("submit",event=>{event.preventDefault();calculate()});
el("calculator").addEventListener("input",calculate);
el("dateMode").addEventListener("change",updateDateMode);
el("otMode").addEventListener("change",()=>{
  const weekly=el("otMode").value==="weekly";
  el("otInputLabel").textContent=weekly?"Planned OT shifts per week":"Planned OT shifts through year-end";
  el("otModeExplanation").textContent=weekly?"Weekly OT is prorated over the remaining calendar days and rounded down to whole shifts.":"Enter the total overtime tours planned through December 31.";
  calculate();
});
el("customDate").addEventListener("change",calculate);
el("vacationMode").addEventListener("change",updateVacationMode);
updateVacationMode();
updateDateMode();
