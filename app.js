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
  const regularNeeded=Math.max(0,Math.ceil((remaining-n.otDays*overtimePay-0.0000001)/regularPay));
  const plannedOTPay=n.otDays*overtimePay;
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
  el("minimumOT").textContent=whole(remaining===0?0:neededOT);
  el("requiredRegular").textContent=whole(remaining===0?0:regularNeeded);
  el("projected").textContent=money(forecast);
  el("gap").textContent=money(gap);
  el("plannedEarnings").textContent=money(plannedOTPay);
  let message;
  if(remaining===0)message="Congratulations! You've already reached your annual goal.";
  else if(days===0)message="No weekdays remain this year. Consider planning for next year.";
  else if(neededOT>days)message=`Even with every regular weekday worked, you'd need ${whole(neededOT)} OT days, more than the ${whole(days)} weekdays left. Try longer OT shifts or change your target.`;
  else if(regularNeeded>days)message=`Your planned OT is not enough. Working all ${whole(days)} remaining weekdays requires at least ${whole(neededOT)} overtime days to reach the goal.`;
  else if(neededOT===0)message="Regular weekday shifts alone can meet your goal. Overtime is optional.";
  else message=`Work all ${whole(days)} remaining weekdays and add at least ${whole(neededOT)} overtime days of ${n.otHours} extra hours each. With your planned OT, you'll need ${whole(regularNeeded)} regular days.`;
  if(n.otDays>days)message+=" Your planned OT days exceed remaining weekdays.";
  el("guidance").textContent=message;
}
el("calculator").addEventListener("submit",event=>{event.preventDefault();calculate()});
el("calculator").addEventListener("input",calculate);
calculate();
