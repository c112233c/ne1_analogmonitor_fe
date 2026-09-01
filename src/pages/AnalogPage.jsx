import {useEffect,useState} from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {getStations,getBays,getPoints,getHistory} from "../api/analog";
import StationSelector from "../components/StationSelector";
import BaySelector from "../components/BaySelector";
import AnalogTabs from "../components/AnalogTabs";
import AnalogSummary from "../components/AnalogSummary";
import AnalogChart from "../components/AnalogChart";

const day=d=>d.toISOString().slice(0,10);
const parseDate=value=>value?new Date(`${value}T00:00:00`):null;
const formatInputDate=date=>date?`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`:"";
export default function AnalogPage(){
 const now=new Date(), prev=new Date(now); prev.setDate(now.getDate()-1);
 const [stations,setStations]=useState([]),[bays,setBays]=useState([]),[points,setPoints]=useState([]);
 const [station,setStation]=useState(""),[bay,setBay]=useState(""),[point,setPoint]=useState(null);
 const [from,setFrom]=useState(day(prev)),[to,setTo]=useState(day(now)),[data,setData]=useState([]),[meta,setMeta]=useState(null);
 const [loading,setLoading]=useState(false),[error,setError]=useState("");
 useEffect(()=>{getStations().then(setStations).catch(e=>setError(e.message));},[]);
 useEffect(()=>{setBay("");setBays([]);setPoints([]);setPoint(null);setData([]);if(station)getBays(station).then(setBays).catch(e=>setError(e.message));},[station]);
 useEffect(()=>{setPoints([]);setPoint(null);setData([]);if(station&&bay)getPoints(station,bay).then(p=>{setPoints(p);setPoint(p[0]||null)}).catch(e=>setError(e.message));},[station,bay]);
 const load=async()=>{if(!point)return;setLoading(true);setError("");try{const r=await getHistory(point.gid,`${from} 00:00:00`,`${to} 23:59:59`);setMeta(r.point);setData(r.data||[]);}catch(e){setError(e.message);setData([]);}finally{setLoading(false);}};
 useEffect(()=>{if(point)load();},[point]);
 const preset=(days)=>{const e=new Date(),s=new Date(e);s.setDate(e.getDate()-days);setFrom(day(s));setTo(day(e));};
 return <main className="app-shell">
  <header className="topbar"><div><div className="brand">SCADA <span>ANALOG</span></div><h1>Analog Monitoring</h1><p>Historical min / avg / max from 30-minute SCADA data</p></div><div className="status"><i/> MariaDB</div></header>
  <section className="card controls"><div className="control-grid"><StationSelector stations={stations} value={station} onChange={setStation}/><BaySelector bays={bays} value={bay} onChange={setBay} disabled={!station}/><label className="field"><span>From</span><DatePicker selected={parseDate(from)} onChange={date=>setFrom(formatInputDate(date))} dateFormat="dd/MM/yyyy" className="date-picker-input" /></label><label className="field"><span>To</span><DatePicker selected={parseDate(to)} onChange={date=>setTo(formatInputDate(date))} dateFormat="dd/MM/yyyy" className="date-picker-input" /></label><button className="search" disabled={!point||loading} onClick={load}>{loading?"Loading...":"Search"}</button></div><div className="presets"><button onClick={()=>preset(0)}>Today</button><button onClick={()=>preset(1)}>Last 24 Hours</button><button onClick={()=>preset(7)}>Last 7 Days</button><button onClick={()=>preset(30)}>Last 30 Days</button></div></section>
  {error&&<div className="error">{error}</div>}
  <section className="card point-card"><div className="section-head"><div><div className="eyebrow">Analog points</div><h2>{station&&bay?`${station} / ${bay}`:"Select a station and bay"}</h2></div>{point&&<span className="chip">GID {point.gid}</span>}</div>
  <AnalogTabs points={points} value={point} onChange={p=>{setPoint(p);setData([])}}/></section>
  {point&&<><AnalogSummary point={meta||point} data={data}/>
  <section className="card chart-card"><div className="section-head"><div><div className="eyebrow">Historical trend</div><h2>{point.type} / {point.unit||"No unit"}</h2></div><span className="sample-count">{data.length.toLocaleString()} samples</span></div><AnalogChart data={data} unit={point.unit}/></section></>}
 </main>;
}
