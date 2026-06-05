import React, { useState } from 'react';
import { Calendar, PlayCircle, Info } from 'lucide-react';
import { calculateDetailedAge, AgeDetails } from '../utils';

export default function AgeCalculator() {
  const [dob, setDob] = useState('1998-05-18');
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [results, setResults] = useState<AgeDetails | null>(calculateDetailedAge('1998-05-18'));

  const handleCalculate = () => {
    if (!dob) {
      alert('Please select your Date of Birth.');
      return;
    }
    const computed = calculateDetailedAge(dob, targetDate);
    if (!computed) {
      alert('Invalid calculations query. DOB cannot be in the future relative to the target calculations date.');
      return;
    }
    setResults(computed);
  };

  return (
    <div className="flex flex-col gap-5">
      
      <div className="panel-header">
        <h2 className="panel-title">
          <Calendar className="w-5 h-5 shrink-0" />
          Detailed Age calculations Engine
        </h2>
      </div>

      <div className="tool-layout">
        
        {/* INPUT PANEL COLUMN */}
        <div className="config-card">
          <h3 className="font-bold text-gray-950 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">
            Enter Birth Coordinates
          </h3>

          <div className="form-group">
            <label htmlFor="comp-dob">Date of Birth (DOB)</label>
            <input 
              type="date" 
              id="comp-dob" 
              value={dob} 
              onChange={(e) => setDob(e.target.value)} 
              className="p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-900"
            />
          </div>

          <div className="form-group">
            <label htmlFor="comp-target">Calculate Age As Of</label>
            <input 
              type="date" 
              id="comp-target" 
              value={targetDate} 
              onChange={(e) => setTargetDate(e.target.value)}
              className="p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-900"
            />
          </div>

          <button 
            type="button" 
            onClick={handleCalculate}
            className="btn-primary flex items-center justify-center gap-2 py-3 mt-2"
          >
            <PlayCircle className="w-5 h-5" />
            Compute Life Statistics
          </button>
        </div>

        {/* RESULTS PANEL COLUMN */}
        <div className="config-card select-none">
          <h3 className="font-bold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800/80 pb-2 text-xs uppercase tracking-widest">
            Calculated Results Sheet
          </h3>

          {results ? (
            <div className="flex flex-col gap-4">
              
              {/* BIG STATS ROW */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 dark:bg-gray-900/60 p-4 rounded-xl border border-gray-100 dark:border-gray-800 text-center">
                  <div className="text-3xl font-black text-blue-600 dark:text-blue-400">{results.years}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Years</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/60 p-4 rounded-xl border border-gray-100 dark:border-gray-800 text-center">
                  <div className="text-3xl font-black text-blue-600 dark:text-blue-400">{results.months}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Months</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/60 p-4 rounded-xl border border-gray-100 dark:border-gray-800 text-center">
                  <div className="text-3xl font-black text-blue-600 dark:text-blue-400">{results.days}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Days</div>
                </div>
              </div>

              {/* DETAILED STATS LIST */}
              <div className="rounded-2xl bg-blue-500/5 border border-blue-500/10 p-5 flex flex-col gap-3">
                <div className="flex justify-between items-center text-sm border-b border-blue-500/10 pb-2">
                  <span className="text-gray-400 font-semibold">Next Birthday Countdown:</span>
                  <span className="font-black text-blue-600 dark:text-blue-400">{results.nextBirthdayText}</span>
                </div>
                
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Total Months Lived:</span>
                  <span className="font-mono text-gray-950 dark:text-slate-200 font-extrabold">{results.totalMonths.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Total Weeks Lived:</span>
                  <span className="font-mono text-gray-950 dark:text-slate-200 font-extrabold">{results.totalWeeks.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Total Days Lived:</span>
                  <span className="font-mono text-gray-950 dark:text-slate-200 font-extrabold">{results.totalDays.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Total Hours Lived:</span>
                  <span className="font-mono text-gray-950 dark:text-slate-200 font-extrabold">{results.totalHours.toLocaleString()}</span>
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-12 text-sm text-gray-400 flex flex-col items-center gap-2">
              <Info className="w-8 h-8 text-gray-300" />
              <span>Select date values and click calculate above</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
