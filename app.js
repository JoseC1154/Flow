// FILE: app.js
"use strict";
const el = (id) => document.getElementById(id);
const money = (value) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(value);
const whole = (value) => new Intl.NumberFormat("en-US").format(value);
const currencyValue = (input) => Number(input.value.replace(/[^0-9.]/g,""));
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
  if(["ytd","goal","rate"].some(id=>!el(id).value.trim())){el("error").hidden=true;return;}
  const n=Object.fromEntries(ids.map(id=>[id,el(id).dataset.currency==="true"?currencyValue(el(id)):Number(el(id).value)]));
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
  const planOverCapacity=requestedOT>availableOT;
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
  updateGoalStatus({forecast,goal:n.goal,remaining,neededOT,additionalOT,availableOT,overtimePay,gap,planOverCapacity,requestedOT});
}
const ENCOURAGEMENT_MESSAGES=[
"Every well-planned shift is progress.",
"Your target becomes clearer with every update.",
"Small steps make a measurable difference.",
"A steady plan can create strong results.",
"Keep your goal in view and your schedule realistic.",
"Progress matters more than perfection.",
"You are building a clearer picture of your future.",
"The next shift is another opportunity.",
"A practical plan is a powerful starting point.",
"Consistency helps turn goals into results.",
"Your effort deserves a thoughtful plan.",
"Focus on what is within reach today.",
"Each calculation helps you make an informed choice.",
"Stay focused on your priorities and your rest.",
"A flexible plan can adapt as life changes.",
"You can adjust the route without losing the goal.",
"Good planning includes time to recharge.",
"Celebrate progress, even before the finish line.",
"A realistic target is worth working toward.",
"Make your available time count.",
];
let previousStatus=null;
let soundEnabled=true;
let audioContext=null;
let encouragementIndex=-1;
function chooseEncouragement(){
  let i=Math.floor(Math.random()*ENCOURAGEMENT_MESSAGES.length);
  if(i===encouragementIndex)i=(i+1)%ENCOURAGEMENT_MESSAGES.length;
  encouragementIndex=i;
  return ENCOURAGEMENT_MESSAGES[i];
}
function playStatusSound(status){
  if(!soundEnabled||!(status==="success"||status==="unreachable"||status==="invalid-plan"))return;
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio)return;
  try{
    audioContext=audioContext||new Audio();
    if(audioContext.state==="suspended")audioContext.resume().catch(()=>{});
    const notes=status==="success"?[880,1108.73,1318.51]:[1318.5,1046.5,880,698.46,523.25];
    notes.forEach((frequency,i)=>{
      const oscillator=audioContext.createOscillator();
      const gain=audioContext.createGain();
      const t=audioContext.currentTime+.025+i*.10;
      oscillator.type=status==="success"?"sine":"triangle";oscillator.frequency.setValueAtTime(frequency,t);
      if(status!=="success")oscillator.frequency.exponentialRampToValueAtTime(Math.max(350,frequency*.72),t+.18);
      gain.gain.setValueAtTime(.0001,t);
      gain.gain.exponentialRampToValueAtTime(.055,t+.02);
      gain.gain.exponentialRampToValueAtTime(.0001,t+.2);
      oscillator.connect(gain);gain.connect(audioContext.destination);
      oscillator.start(t);oscillator.stop(t+.21);
    });
  }catch(_error){}
}
function updateGoalStatus({forecast,goal,remaining,neededOT,additionalOT,availableOT,overtimePay,gap,planOverCapacity,requestedOT}){
  const status=planOverCapacity?"invalid-plan":forecast>=goal?"success":neededOT>availableOT?"unreachable":"needs-ot";
  const box=el("goalStatus");
  box.className="goal-status status-"+status;
  const titles={success:"On track to meet your goal","needs-ot":"More overtime needed",unreachable:"Goal beyond estimated OT capacity","invalid-plan":"Planned overtime exceeds availability"};
  const symbols={success:"✓","needs-ot":"↗",unreachable:"!","invalid-plan":"!"};
  el("goalStatusIcon").textContent=symbols[status];
  el("goalStatusTitle").textContent=titles[status];
  let detail;
  if(status==="success")detail=remaining===0?"Your year-to-date earnings already meet the goal.":"Your planned year-end earnings exceed the goal by "+money(forecast-goal)+".";
  else if(status==="needs-ot")detail="Your current plan is short by "+money(goal-forecast)+". Approximately "+whole(additionalOT)+" additional OT tours would reach your goal within estimated capacity.";
  else if(status==="invalid-plan")detail="You requested "+whole(requestedOT)+" OT tours but only "+whole(availableOT)+" are estimated available. The forecast is capped. Reduce OT or adjust vacation.";
  else detail="Even with all "+whole(availableOT)+" estimated available OT tours, the goal would remain short by "+money(Math.max(0,gap-availableOT*overtimePay))+"."; 
  el("goalStatusDetail").textContent=detail;
  if(status!==previousStatus){
    el("encouragement").textContent=chooseEncouragement();
    if(!el("dashboard").hidden)playStatusSound(status);
    previousStatus=status;
  }
}
el("soundToggle").addEventListener("click",()=>{
  soundEnabled=!soundEnabled;
  el("soundToggle").textContent=soundEnabled?"Sound on":"Sound off";
  el("soundToggle").setAttribute("aria-pressed",String(soundEnabled));
});
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
// Currency inputs behave like a point-of-sale keypad: rightmost two digits are cents.
// Works for all earnings amounts, including hourly base pay, without disrupting OT steppers.
function installCurrencyInputs(){
  const formatter=new Intl.NumberFormat("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
  document.querySelectorAll('input[data-currency="true"]').forEach(input=>{
    let cents=input.value.trim()?Math.round(currencyValue(input)*100):0;
    const redraw=()=>{
      input.value=formatter.format(cents/100);
      input.setSelectionRange(input.value.length,input.value.length);
      input.dispatchEvent(new Event("input",{bubbles:true}));
    };
    input.addEventListener("keydown",event=>{
      if(event.ctrlKey||event.metaKey||event.altKey||event.key==="Tab"||event.key.startsWith("Arrow")||event.key==="Home"||event.key==="End")return;
      if(/^\d$/.test(event.key)){
        event.preventDefault();
        if(input.selectionStart===0&&input.selectionEnd===input.value.length)cents=0;
        cents=Math.min(999999999999,cents*10+Number(event.key));
        redraw();
      }else if(event.key==="Backspace"||event.key==="Delete"){
        event.preventDefault();
        if(input.selectionStart===0&&input.selectionEnd===input.value.length)cents=0;
        else cents=Math.floor(cents/10);
        redraw();
      }else if(event.key.length===1){
        event.preventDefault();
      }
    });
    input.addEventListener("paste",event=>{
      const text=event.clipboardData?.getData("text")||"";
      const parsed=text.replace(/[$,\s]/g,"").trim();
      if(!/^\d+(?:\.\d{0,2})?$/.test(parsed))return;
      event.preventDefault();
      cents=Math.min(999999999999,Math.round(Number(parsed)*100));
      redraw();
    });
    input.addEventListener("input",()=>{
      const displayed=formatter.format(cents/100);
      if(input.value!==displayed){
        const raw=input.value.replace(/\D/g,"");
        cents=Math.min(999999999999,Number(raw)||0);
        input.value=formatter.format(cents/100);
      }
    });
    input.addEventListener("focus",()=>input.select());
  });
}
installCurrencyInputs();
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



const INPUT_TIPS={
 dateMode:"Choose today or a custom forecast date.",
 customDate:"Year-end calculations start the day after this date.",
 ytd:"Gross earnings so far. Digits automatically shift the cents.",
 goal:"Your desired annual gross earnings.",
 rate:"Base hourly wage. Saved on this device.",
 hours:"Regular tours are eight hours.",
 otHours:"Overtime tours are eight hours, paid at 1.5×.",
 otMode:"Select weekly overtime or a year-end total.",
 otDays:"Number of planned eight-hour OT tours.",
 vacationMode:"Include vacation to remove OT during those weeks.",
 vacationWeeks:"How many full vacation weeks remain?",
 dashboardOtMode:"Change the overtime planning period.",
 dashboardOtDays:"Adjust overtime without restarting the setup."
};
function installInputTips(){
 for(const [id,tip] of Object.entries(INPUT_TIPS)){
  const field=el(id);if(!field)continue;
  const label=field.closest("label");if(!label)continue;
  const helper=document.createElement("small");
  helper.className="input-tip";
  helper.id=id+"Tip";
  helper.textContent=tip;
  label.appendChild(helper);
  field.setAttribute("aria-describedby",helper.id);
  if(field.dataset.currency==="true")field.placeholder="Enter amount";
 }
}
installInputTips();
const PREF_KEY="PAYPATH_INPUT_PREFERENCES_V1";
const preferenceIds=["dateMode","customDate","ytd","goal","rate","otMode","otDays","vacationMode","vacationWeeks"];
function savePreferences(){
 try{
  window.localStorage.setItem(PREF_KEY,JSON.stringify(Object.fromEntries(preferenceIds.map(id=>[id,el(id).value]))));
 }catch(_error){}
}
function loadPreferences(){
 try{
  const raw=window.localStorage.getItem(PREF_KEY);
  if(!raw)return;
  const data=JSON.parse(raw);
  for(const id of preferenceIds)if(typeof data[id]==="string")el(id).value=data[id];
 }catch(_error){}
}
loadPreferences();
el("calculator").addEventListener("input",savePreferences);
el("calculator").addEventListener("change",savePreferences);

// Guided setup. Keep the original inputs as the single source of truth.
function initializeWizard(){
  const form=el("calculator");
  const panel=form.closest(".panel");
  const overlay=document.createElement("div");
  overlay.className="wizard-overlay";
  overlay.id="setupOverlay";
  overlay.setAttribute("role","dialog");
  overlay.setAttribute("aria-modal","true");
  overlay.setAttribute("aria-label","Set up your earnings plan");
  document.body.appendChild(overlay);
  overlay.appendChild(panel);
  const welcome=document.createElement("section");
  welcome.className="wizard-welcome panel";
  welcome.setAttribute("aria-labelledby","welcomeTitle");
  welcome.innerHTML='<div class="welcome-symbol" aria-hidden="true">↗</div><p class="welcome-kicker">WELCOME TO PAYPATH</p><h2 id="welcomeTitle">Your earnings goal. <span>A clearer path.</span></h2><p>Plan your annual gross earnings with guaranteed regular tours, time-and-a-half overtime, vacation weeks and a year-end forecast.</p><p class="welcome-detail">Four quick steps to build your plan. Adjust overtime anytime on the dashboard.</p><button type="button" id="beginSetup">Get started →</button>';
  overlay.insertBefore(welcome,panel);
  panel.hidden=true;
  panel.style.display="none";
  const fields=Array.from(form.querySelectorAll(".fields > label"));
  const groups=[
    ["dateMode","customDate"],
    ["ytd","goal","rate"],
    ["vacationMode","vacationWeeks"],
    ["otMode","otDays"]
  ];
  const headings=[
    ["When should we calculate from?","Choose today or enter a custom date."],
    ["Tell us about your earnings","Your hourly wage will be remembered on this device."],
    ["Will you take vacation?","Vacation weeks cannot include overtime."],
    ["Plan your overtime","Choose weekly tours or a year-end total."]
  ];
  const existingHeading=panel.querySelector(".section-title h2");
  const existingSubtitle=panel.querySelector(".section-title p");
  const originalSubmit=form.querySelector('button[type="submit"]');
  originalSubmit.hidden=true;
  originalSubmit.style.display="none";
  // Hours are fixed at 8 and need not be asked during setup.
  const fixedHours=fields.filter(label=>["hours","otHours"].includes(label.querySelector("input,select")?.id));
  fixedHours.forEach(label=>label.style.display="none");
  const notes=Array.from(form.querySelectorAll(".note"));
  notes.forEach(note=>note.style.display="none");
  const footer=document.createElement("div");
  footer.className="wizard-actions";
  footer.innerHTML='<span id="wizardStep" class="wizard-counter"></span><div class="wizard-buttons"><button type="button" id="wizardBack" class="secondary-button">Back</button><button type="button" id="wizardNext">Continue →</button></div>';
  form.appendChild(footer);
  let step=0;
  let completed=false;
  let transitioning=false;
  const fieldIds=(label)=>label.querySelector("input,select")?.id;
  function renderStep(){
    const numberBadge=panel.querySelector(".section-title .number");
    if(numberBadge)numberBadge.textContent=String(step+1).padStart(2,"0");
    existingHeading.textContent=headings[step][0];
    existingSubtitle.textContent=headings[step][1];
    fields.forEach(label=>{
      const visible=groups[step].includes(fieldIds(label));
      label.style.display=visible?"":"none";
    });
    el("wizardStep").textContent=`Step ${step+1} of ${groups.length}`;
    el("wizardBack").hidden=step===0;
    el("wizardBack").style.display=step===0?"none":"";
    el("wizardNext").textContent=step===groups.length-1?"Show my forecast →":"Continue →";
    if(groups[step].includes("dateMode"))updateDateMode();
    if(groups[step].includes("vacationMode"))updateVacationMode();
    // Preserve conditional fields hidden by date and vacation logic.
    fields.forEach(label=>{
      if(!groups[step].includes(fieldIds(label)))label.style.display="none";
    });
  }
  function stepChange(target){
    if(transitioning)return;
    transitioning=true;
    panel.classList.add("wizard-exit");
    window.setTimeout(()=>{
      step=target;renderStep();
      panel.classList.remove("wizard-exit");
      panel.classList.add("wizard-enter");
      panel.querySelector("input:not([disabled]), select:not([disabled])")?.focus();
      window.setTimeout(()=>{panel.classList.remove("wizard-enter");transitioning=false;},230);
    },180);
  }
  function validateStep(){
    for(const id of groups[step]){
      const input=el(id);
      if(!input||input.disabled||input.closest("label")?.style.display==="none")continue;
      if(input.dataset.currency==="true"&&(!input.value.trim()||!Number.isFinite(currencyValue(input))||currencyValue(input)<=0&&input.id!=="ytd")){input.focus();return false;}
      if(input.type==="number"&&(!input.value.trim()||!input.checkValidity())){input.focus();return false;}
      if(input.type==="date"&&!input.value){input.focus();return false;}
    }
    return true;
  }
  function showWelcome(){
    panel.hidden=true;
    panel.style.display="none";
    welcome.hidden=false;
    welcome.style.display="";
    overlay.setAttribute("aria-label","Welcome to PayPath");
    el("beginSetup").focus();
  }
  el("beginSetup").addEventListener("click",()=>{
    welcome.hidden=true;
    welcome.style.display="none";
    panel.hidden=false;
    panel.style.display="";
    panel.classList.add("wizard-enter");
    overlay.setAttribute("aria-label","Set up your earnings plan");
    renderStep();
    panel.querySelector(".fields select:not([disabled]), .fields input:not([disabled])")?.focus();
    window.setTimeout(()=>panel.classList.remove("wizard-enter"),230);
  });
  el("wizardBack").addEventListener("click",()=>stepChange(Math.max(0,step-1)));
  el("wizardNext").addEventListener("click",()=>{
    if(!validateStep())return;
    if(step<groups.length-1){stepChange(step+1);return;}
    calculate();
    if(!el("error").hidden)return;
    completed=true;
    overlay.classList.add("wizard-finish");
    el("dashboard").hidden=false;
    el("dashboardOtMode").value=el("otMode").value;
    el("dashboardOtDays").value=el("otDays").value;
    window.setTimeout(()=>{overlay.hidden=true;overlay.style.display="none";},240);
    el("dashboard").scrollIntoView({behavior:"smooth",block:"start"});
  });
  const syncDashboard=()=>{
    el("otMode").value=el("dashboardOtMode").value;
    el("otDays").value=el("dashboardOtDays").value;
    const weekly=el("otMode").value==="weekly";
    el("otInputLabel").textContent=weekly?"Planned OT shifts per week":"Planned OT shifts through year-end";
    calculate();
  };
  el("dashboardOtMode").addEventListener("change",syncDashboard);
  el("dashboardOtDays").addEventListener("input",syncDashboard);
  el("startOver").addEventListener("click",()=>{
    completed=false;step=0;
    el("dashboard").hidden=true;
    overlay.hidden=false;overlay.style.display="flex";
    overlay.classList.remove("wizard-finish");
    renderStep();showWelcome();window.scrollTo({top:0,behavior:"smooth"});
  });
  // Restore existing saved wage only if not in the saved preferences.
  const storageKey="PAYPATH_HOURLY_WAGE_V1";
  try{
    const saved=window.localStorage.getItem(storageKey);
    if(!el("rate").value&&saved!==null&&Number.isFinite(Number(saved))&&Number(saved)>0)el("rate").value=Number(saved).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
  }catch(_error){}
  el("rate").addEventListener("input",()=>{
    const value=currencyValue(el("rate"));
    if(Number.isFinite(value)&&value>0){
      try{window.localStorage.setItem(storageKey,String(value));}catch(_error){}
    }
  });
  renderStep();
  showWelcome();
  calculate();
}
initializeWizard();
