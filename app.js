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
  const slots=[];
  const end=new Date(today.getFullYear(),11,31);
  let regular=0;
  // Each business date has shifts starting 07:00, 15:00, 23:00.
  // Assume regular weekday shift 07:00–15:00 until employee's rotation is known.
  for(let date=new Date(today.getFullYear(),today.getMonth(),today.getDate()+1);
      date<=end;date.setDate(date.getDate()+1)){
    const weekday=date.getDay()!==0&&date.getDay()!==6;
    for(const startHour of [7,15,23]){
      const isRegular=weekday&&startHour===7;
      slots.push(isRegular);
      if(isRegular)regular++;
    }
  }
  // A chosen shift must have at least one intervening 8-hour shift slot
  // before the next chosen shift (8 hours off between 8-hour shifts).
  // Regular shifts are mandatory; optimize additional shifts around them.
  let previousNone=0,previousWorked=-Infinity;
  for(let i=0;i<slots.length;i++){
    const isRegular=slots[i];
    const nextNone=isRegular?-Infinity:Math.max(previousNone,previousWorked);
    const nextWorked=previousNone+(isRegular?0:1);
    // DP only needs last shift chosen versus not chosen. Taking the next
    // adjacent slot would violate the 8-hour rest requirement.
    previousNone=nextNone;
    previousWorked=nextWorked;
  }
  return {regular, slots:slots.length, maxOT:Math.max(0,previousNone,previousWorked)};
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
  const today=dateNow();
  const calendarDays=daysUntilYearEnd(today);
  const schedule=remainingSchedule(today);
  const regularPay=n.rate*8;
  const overtimePay=n.rate*1.5*8;
  const remaining=Math.max(0,n.goal-n.ytd);
  const gap=Math.max(0,remaining-schedule.regular*regularPay);
  const neededOT=gap<=0?0:Math.ceil((gap-0.0000001)/overtimePay);
  const plannedShifts=Math.min(n.otDays,schedule.maxOT);
  const additionalOT=Math.max(0,neededOT-plannedShifts);
  const achievable=neededOT<=schedule.maxOT;
  const forecast=n.ytd+schedule.regular*regularPay+plannedShifts*overtimePay;
  const percent=Math.min(100,n.ytd/n.goal*100);
  el("dateLabel").textContent=`${today.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})} to December 31 · 24/7 operation`;
  el("percent").textContent=`${percent.toFixed(1)}% achieved`;
  el("progress").style.width=`${percent}%`;
  el("remaining").textContent=money(remaining);
  el("weeks").textContent=(calendarDays/7).toFixed(1);
  el("weekdays").textContent=whole(calendarDays);
  el("workdays").value=schedule.regular;
  el("shiftSlots").textContent=whole(schedule.slots);
  el("otCapacity").textContent=whole(schedule.maxOT);
  el("dayPay").textContent=money(regularPay);
  el("otPay").textContent=money(overtimePay);
  el("minimumOT").textContent=achievable?whole(additionalOT):"Not possible";
  el("requiredRegular").textContent=whole(schedule.regular);
  el("projected").textContent=money(forecast);
  el("gap").textContent=money(gap);
  el("plannedEarnings").textContent=money(plannedShifts*overtimePay);
  let message;
  if(remaining===0)message="You've already reached your annual goal.";
  else if(calendarDays===0)message="No calendar days remain this year.";
  else if(!achievable)message=`Under the assumed Mon–Fri 07:00–15:00 regular schedule and 8-hour minimum rest, at most ${whole(schedule.maxOT)} overtime shifts fit. Your goal would require ${whole(neededOT)} OT shifts, leaving ${money(Math.max(0,gap-schedule.maxOT*overtimePay))} short.`;
  else if(additionalOT===0)message=neededOT===0?"Your projected regular shifts alone meet the goal.":"Your planned OT shifts cover the overtime required for your goal.";
  else message=`With ${whole(schedule.regular)} regular shifts and ${whole(plannedShifts)} planned OT shifts, schedule ${whole(additionalOT)} additional OT shifts. The rest-rule maximum is ${whole(schedule.maxOT)} OT shifts.`;
  if(n.otDays>schedule.maxOT)message+=" Planned OT was capped to the rest-rule maximum.";
  el("guidance").textContent=message;
}
el("calculator").addEventListener("submit",event=>{event.preventDefault();calculate()});
el("calculator").addEventListener("input",calculate);
calculate();
