// FILE: app.js
"use strict";
const el = (id) => document.getElementById(id);
const money = (value) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(value);
const whole = (value) => new Intl.NumberFormat("en-US").format(value);
const dateNow = () => new Date();
function weekdaysRemaining(today){
  let count=0;
  const end=new Date(today.getFullYear(),11,31);
  for(let d=new Date(today.getFullYear(),today.getMonth(),today.getDate()+1);d<=end;d.setDate(d.getDate()+1)){
    if(d.getDay()!==0&&d.getDay()!==6)count++;
  }
  return count;
}
function calculate(){
  const ids=["ytd","goal","rate","hours","otHours","otDays"];
  const n=Object.fromEntries(ids.map(id=>[id,Number(el(id).value)]));
  const error=el("error");
  if(ids.some(id=>el(id).value.trim()===""||!Number.isFinite(n[id]))||n.ytd<0||n.goal<=0||n.rate<=0||n.hours<=0||n.hours>24||n.otHours<=0||n.otHours>24||n.otDays<0||!Number.isInteger(n.otDays)){
    error.hidden=false;error.textContent="Please enter valid earnings and hours, with a whole number of overtime days.";return;
  }
  error.hidden=true;
  const today=dateNow();
  const calendarDays=Math.max(0,Math.round((Date.UTC(today.getFullYear(),11,31)-Date.UTC(today.getFullYear(),today.getMonth(),today.getDate()))/86400000));
  const days=weekdaysRemaining(today);
  const regularPay=n.rate*n.hours;
  const overtimePay=n.rate*1.5*n.otHours;
  const remaining=Math.max(0,n.goal-n.ytd);
  const gap=Math.max(0,remaining-days*regularPay);
  const neededOT=gap<=0?0:Math.ceil((gap-0.0000001)/overtimePay);
  const plannedDays=Math.min(n.otDays,days);
  const plannedOTPay=plannedDays*overtimePay;
  const additionalOT=Math.max(0,neededOT-plannedDays);
  const achievable=neededOT<=days;
  const forecast=n.ytd+days*regularPay+plannedOTPay;
  const percent=Math.min(100,n.ytd/n.goal*100);
  el("dateLabel").textContent=`${today.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})} to December 31`;
  el("percent").textContent=`${percent.toFixed(1)}% achieved`;
  el("progress").style.width=`${percent}%`;
  el("remaining").textContent=money(remaining);
  el("weeks").textContent=(calendarDays/7).toFixed(1);
  el("weekdays").textContent=whole(days);
  el("dayPay").textContent=money(regularPay);
  el("otPay").textContent=money(overtimePay);
  el("minimumOT").textContent=achievable?whole(additionalOT):"Not possible";
  el("requiredRegular").textContent=whole(days);
  el("projected").textContent=money(forecast);
  el("gap").textContent=money(gap);
  el("plannedEarnings").textContent=money(plannedOTPay);
  let message;
  if(remaining===0)message="Congratulations! You've already reached your annual goal.";
  else if(days===0)message="No weekdays remain this year. Consider planning for next year.";
  else if(!achievable)message=`Not possible with the current schedule: only ${whole(days)} regular workdays remain, so at most ${whole(days)} OT days can be scheduled. Even adding ${n.otHours} overtime hours on every remaining workday would leave ${money(Math.max(0,gap-days*overtimePay))} short. Increase OT hours per shift or adjust the goal.`;
  else if(additionalOT===0)message=neededOT===0?"Regular workdays alone can meet your goal; overtime is optional.":`Your ${whole(plannedDays)} planned OT days cover the ${whole(neededOT)} OT days needed. No additional OT days are required.`;
  else message=`Work all ${whole(days)} remaining regular workdays. Your ${whole(plannedDays)} planned OT days count toward the ${whole(neededOT)} total required; schedule ${whole(additionalOT)} additional OT days.`;
  if(n.otDays>days)message+=" Planned overtime was capped at the remaining workdays.";
  el("guidance").textContent=message;
}
el("calculator").addEventListener("submit",event=>{event.preventDefault();calculate()});
el("calculator").addEventListener("input",calculate);
calculate();
