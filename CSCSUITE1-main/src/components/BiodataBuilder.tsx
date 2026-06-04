import React, { useState } from 'react';
import { FileText, Printer, Shield } from 'lucide-react';

export default function BiodataBuilder() {
  const [template, setTemplate] = useState<'traditional' | 'modern' | 'classic'>('traditional');
  const [activeFormTab, setActiveFormTab] = useState<'personal' | 'family' | 'edu' | 'skills'>('personal');

  // Input States
  const [fullname, setFullname] = useState('Rahul Shrivastava');
  const [dob, setDob] = useState('1998-05-18');
  const [email, setEmail] = useState('rahul.shrivas@gmail.com');
  const [phone, setPhone] = useState('+91 91234 56789');
  const [address, setAddress] = useState('House No. 42, Civil Lines, Bhopal, MP - 462002');
  const [height, setHeight] = useState('5 ft 9 in');
  const [complexion, setComplexion] = useState('Fair / Brahmin');

  const [father, setFather] = useState('Mr. Suresh Shrivastava');
  const [fatherOcc, setFatherOcc] = useState('Senior Inspector (Govt Service)');
  const [mother, setMother] = useState('Mrs. Sunita Shrivastava (Home Maker)');
  const [siblings, setSiblings] = useState('1 Elder Sister (Married), 1 Younger Brother (Studying)');
  const [tob, setTob] = useState('08:45 AM');
  const [pob, setPob] = useState('Jaipur, Rajasthan');
  const [gotra, setGotra] = useState('Garg / Singh');
  const [manglik, setManglik] = useState('No');

  const [qualification, setQualification] = useState('B.Tech in Computer Science');
  const [college, setCollege] = useState('National Institute of Technology');
  const [occupation, setOccupation] = useState('Software Development Engineer at Infosys');
  const [income, setIncome] = useState('₹12,00,000 Per Annum');

  const [skills, setSkills] = useState('Typing, Microsoft Office Excel, React JS, Python, Customer Relations');
  const [experience, setExperience] = useState('Worked for 2 years as software designer and managed local cyber center accounts data.');

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to compile printout.");
      return;
    }

    let inlineHtml = '';

    if (template === 'traditional') {
      inlineHtml = `
        <div class="biodata-traditional">
          <div class="biodata-traditional-header">
            <div class="shree-ganesh-icon">ॐ</div>
            <div class="biodata-traditional-title">Marrige Biodata</div>
          </div>
          
          <div class="traditional-section">
            <div class="traditional-section-title">Personal Information</div>
            <div class="traditional-grid">
              <div class="traditional-label">Full Name:</div>
              <div>${fullname}</div>
              <div class="traditional-label">Date of Birth:</div>
              <div>${dob}</div>
              <div class="traditional-label">Height:</div>
              <div>${height}</div>
              <div class="traditional-label">Complexion/Caste:</div>
              <div>${complexion}</div>
              <div class="traditional-label">Permanent Address:</div>
              <div>${address}</div>
            </div>
          </div>

          <div class="traditional-section">
            <div class="traditional-section-title">Horoscope Details</div>
            <div class="traditional-grid">
              <div class="traditional-label">Time of Birth:</div>
              <div>${tob}</div>
              <div class="traditional-label">Place of Birth:</div>
              <div>${pob}</div>
              <div class="traditional-label">Gotra/Rashi:</div>
              <div>${gotra}</div>
              <div class="traditional-label">Manglik:</div>
              <div>${manglik}</div>
            </div>
          </div>

          <div class="traditional-section">
            <div class="traditional-section-title">Education & Employment</div>
            <div class="traditional-grid">
              <div class="traditional-label">Qualification:</div>
              <div>${qualification}</div>
              <div class="traditional-label">Institute Name:</div>
              <div>${college}</div>
              <div class="traditional-label">Current Job:</div>
              <div>${occupation}</div>
              <div class="traditional-label">Monthly/Annual Income:</div>
              <div>${income}</div>
            </div>
          </div>

          <div class="traditional-section">
            <div class="traditional-section-title">Family Information</div>
            <div class="traditional-grid">
              <div class="traditional-label">Father's Name:</div>
              <div>${father}</div>
              <div class="traditional-label">Occupation:</div>
              <div>${fatherOcc}</div>
              <div class="traditional-label">Mother's Name:</div>
              <div>${mother}</div>
              <div class="traditional-label">Sibling Details:</div>
              <div>${siblings}</div>
            </div>
          </div>
        </div>
      `;
    } else if (template === 'classic') {
      inlineHtml = `
        <div class="resume-classic">
          <div class="resume-classic-header">
            <div class="resume-classic-name">${fullname}</div>
            <div class="resume-classic-contact">Email: ${email} | Phone: ${phone} <br /> Address: ${address}</div>
          </div>

          <div class="classic-section">
            <div class="classic-title">Education Profile</div>
            <div class="classic-grid">
              <div class="classic-item-header">
                <span>${qualification}</span>
                <span>Completed</span>
              </div>
              <div style="font-size: 13px; color: #555;">${college}</div>
            </div>
          </div>

          <div class="classic-section">
            <div class="classic-title">Employment Experience</div>
            <div class="classic-grid">
              <div class="classic-item-header">
                <span>${occupation}</span>
                <span>Active</span>
              </div>
              <div style="font-size: 13px; color: #555; white-space: pre-wrap; margin-top: 5px;">${experience}</div>
            </div>
          </div>

          <div class="classic-section">
            <div class="classic-title">Hard & Soft Skills</div>
            <div style="font-size: 14px; line-height: 1.5;">${skills}</div>
          </div>
        </div>
      `;
    } else {
      inlineHtml = `
        <div class="resume-modern">
          <div class="modern-left-pane">
            <div class="modern-avatar-placeholder"></div>
            <div class="modern-left-name">${fullname}</div>
            <div class="modern-left-title">Candidate Profile</div>
            
            <div class="modern-left-section">
              <div class="modern-left-sectitle">Contact Info</div>
              <div class="modern-left-contact-item">📞 ${phone}</div>
              <div class="modern-left-contact-item">✉️ ${email}</div>
              <div class="modern-left-contact-item">📍 ${address}</div>
            </div>

            <div class="modern-left-section">
              <div class="modern-left-sectitle">Tech Skills</div>
              <div style="font-size: 11px; line-height: 1.5; color: #cbd5e1;">${skills}</div>
            </div>
          </div>

          <div class="modern-right-pane">
            <div class="modern-right-section">
              <div class="modern-right-sectitle">Education & Academic</div>
              <div class="modern-right-item">
                <div class="modern-right-item-header">
                  <span>${qualification}</span>
                </div>
                <div class="modern-right-item-sub">${college}</div>
              </div>
            </div>

            <div class="modern-right-section">
              <div class="modern-right-sectitle font-bold">Employment History</div>
              <div class="modern-right-item">
                <div class="modern-right-item-header">
                  <span>${occupation}</span>
                </div>
                <div class="modern-right-item-sub" style="white-space: pre-wrap;">${experience}</div>
                <div class="modern-right-item-sub" style="font-weight: 500;">Compensation Package: ${income}</div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>A4 Document PDF Compile</title>
          <style>
            body { margin: 0; padding: 0; background-color: #fff; font-family: sans-serif; }
            /* Copy custom classes from global css specifically for paper alignment */
            .biodata-traditional {
              padding: 40px; border: 15px double #851414; background-color: #fffef0; color: #5a0c0c; font-family: Georgia, serif; position: relative; max-width: 800px; margin: 0 auto; box-sizing: border-box;
            }
            .biodata-traditional-header { text-align: center; margin-bottom: 30px; }
            .shree-ganesh-icon { font-size: 40px; color: #851414; margin-bottom: 10px; }
            .biodata-traditional-title { font-size: 32px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; border-bottom: 2px solid #851414; display: inline-block; padding-bottom: 5px; }
            .traditional-section { margin-bottom: 24px; }
            .traditional-section-title { font-size: 20px; font-weight: 700; border-bottom: 1px solid #c99393; padding-bottom: 4px; margin-bottom: 14px; text-transform: uppercase; }
            .traditional-grid { display: grid; grid-template-columns: 1.5fr 2.5fr; row-gap: 10px; column-gap: 20px; font-size: 15px; }
            .traditional-label { font-weight: bold; }

            .resume-classic { padding: 50px; font-family: 'Times New Roman', serif; color: #333; background-color: #fff; max-width: 800px; margin: 0 auto; }
            .resume-classic-header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 25px; }
            .resume-classic-name { font-size: 28px; font-weight: 800; }
            .resume-classic-contact { font-size: 14px; color: #666; margin-top: 5px; }
            .classic-section { margin-bottom: 25px; }
            .classic-title { font-size: 18px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #aaa; margin-bottom: 12px; padding-bottom: 2px; }
            .classic-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
            .classic-item-header { display: flex; justify-content: space-between; font-weight: bold; }

            .resume-modern { padding: 0; display: grid; grid-template-columns: 260px 1fr; font-family: sans-serif; color: #334155; background-color: #fff; max-width: 800px; margin: 0 auto; min-height: 100vh; }
            .modern-left-pane { background-color: #0f172a; color: #f8fafc; padding: 40px 30px; }
            .modern-avatar-placeholder { width: 100px; height: 100px; border-radius: 50%; background-color: #334155; margin: 0 auto 30px auto; border: 4px solid #1e293b; }
            .modern-left-name { font-size: 20px; font-weight: 700; text-align: center; margin-bottom: 6px; color: white; }
            .modern-left-title { font-size: 12px; color: #94a3b8; text-align: center; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 30px; }
            .modern-left-section { margin-bottom: 30px; }
            .modern-left-sectitle { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #38bdf8; border-bottom: 1px solid #334155; padding-bottom: 4px; margin-bottom: 12px; font-weight: 705; }
            .modern-left-contact-item { font-size: 12px; color: #cbd5e1; margin-bottom: 8px; word-break: break-all; }
            .modern-right-pane { padding: 40px; background: #fff; }
            .modern-right-section { margin-bottom: 30px; }
            .modern-right-sectitle { font-size: 16px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 16px; text-transform: uppercase; }
            .modern-right-item { margin-bottom: 16px; }
            .modern-right-item-header { display: flex; justify-content: space-between; font-weight: 600; color: #1e293b; margin-bottom: 4px; }
            .modern-right-item-sub { font-size: 12px; color: #64748b; margin-bottom: 6px; }

            @page { size: A4 portrait; margin: 0; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${inlineHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col gap-5">
      
      <div className="panel-header">
        <h2 className="panel-title">
          <FileText className="w-5 h-5 shrink-0" />
          Marriage Biodata & Resume Builder
        </h2>
      </div>

      <div className="tool-layout">
        
        {/* CONFIG INPUT COLLUMN */}
        <div className="config-card">
          <h3 className="font-bold text-gray-950 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">
            1. Form Template Style
          </h3>

          <div className="form-group">
            <label htmlFor="bio-design-style">Design Sheet Style</label>
            <select 
              id="bio-design-style"
              value={template}
              onChange={(e) => setTemplate(e.target.value as any)}
              className="p-2.5 border rounded-lg"
            >
              <option value="traditional">Traditional Indian Marriage Biodata</option>
              <option value="modern">Modern Professional Resume (Dual Pane Layout)</option>
              <option value="classic">Classic Minimalist Resume (White Simple Outline)</option>
            </select>
          </div>

          <h3 className="font-bold text-gray-950 dark:text-white border-b border-gray-100 dark:border-gray-830 pb-2 pt-2">
            2. Collect Details
          </h3>

          <div className="form-tabs text-xs select-none">
            <button 
              className={`form-tab ${activeFormTab === 'personal' ? 'active' : ''}`}
              onClick={() => setActiveFormTab('personal')}
            >
              Personal Details
            </button>
            <button 
              className={`form-tab ${activeFormTab === 'family' ? 'active' : ''}`}
              onClick={() => setActiveFormTab('family')}
            >
              Family & Horoscope
            </button>
            <button 
              className={`form-tab ${activeFormTab === 'edu' ? 'active' : ''}`}
              onClick={() => setActiveFormTab('edu')}
            >
              Academic Qualification
            </button>
            <button 
              className={`form-tab ${activeFormTab === 'skills' ? 'active' : ''}`}
              onClick={() => setActiveFormTab('skills')}
            >
              Job Experiences / Skills / Hobbies
            </button>
          </div>

          {/* ACTIVE FORM PATH */}
          {activeFormTab === 'personal' && (
            <div className="flex flex-col gap-4 mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="bio-form-name">Candidate Name</label>
                  <input type="text" id="bio-form-name" value={fullname} onChange={(e) => setFullname(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="bio-form-dob">Birth Date (DOB)</label>
                  <input type="date" id="bio-form-dob" value={dob} onChange={(e) => setDob(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="bio-form-email">Gmail Address</label>
                  <input type="email" id="bio-form-email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="bio-form-phone">Mobile Number</label>
                  <input type="text" id="bio-form-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="bio-form-addr">Permanent Address</label>
                <textarea id="bio-form-addr" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="bio-form-height">Height (feets)</label>
                  <input type="text" id="bio-form-height" value={height} onChange={(e) => setHeight(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="bio-form-caste">Complexion / Gotra-Caste</label>
                  <input type="text" id="bio-form-caste" value={complexion} onChange={(e) => setComplexion(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {activeFormTab === 'family' && (
            <div className="flex flex-col gap-4 mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="bio-form-father">Father's Name</label>
                  <input type="text" id="bio-form-father" value={father} onChange={(e) => setFather(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="bio-form-focc">Father's Occupation</label>
                  <input type="text" id="bio-form-focc" value={fatherOcc} onChange={(e) => setFatherOcc(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="bio-form-mother">Mother's Name</label>
                  <input type="text" id="bio-form-mother" value={mother} onChange={(e) => setMother(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="bio-form-sib">Siblings Details</label>
                  <input type="text" id="bio-form-sib" value={siblings} onChange={(e) => setSiblings(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="form-group">
                  <label htmlFor="bio-form-tob">Birth Time (TOB)</label>
                  <input type="text" id="bio-form-tob" value={tob} onChange={(e) => setTob(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="bio-form-pob">Birth Place (POB)</label>
                  <input type="text" id="bio-form-pob" value={pob} onChange={(e) => setPob(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="bio-form-gotra">Gotra / Caste Rashi</label>
                  <input type="text" id="bio-form-gotra" value={gotra} onChange={(e) => setGotra(e.target.value)} />
                </div>
              </div>

              <div className="form-group w-32">
                <label htmlFor="bio-form-mang">Manglik Status</label>
                <select 
                  id="bio-form-mang"
                  value={manglik}
                  onChange={(e) => setManglik(e.target.value)}
                  className="p-2 border rounded-md"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="Anshik">Anshik (Partial)</option>
                  <option value="Don't Know">Don't Know</option>
                </select>
              </div>
            </div>
          )}

          {activeFormTab === 'edu' && (
            <div className="flex flex-col gap-4 mt-2">
              <div className="form-group">
                <label htmlFor="bio-form-qual">Highest Qualification Degree</label>
                <input type="text" id="bio-form-qual" value={qualification} onChange={(e) => setQualification(e.target.value)} />
              </div>

              <div className="form-group">
                <label htmlFor="bio-form-col">University School Name</label>
                <input type="text" id="bio-form-col" value={college} onChange={(e) => setCollege(e.target.value)} />
              </div>

              <div className="form-group">
                <label htmlFor="bio-form-job">Employment / Active Job Position</label>
                <input type="text" id="bio-form-job" value={occupation} onChange={(e) => setOccupation(e.target.value)} />
              </div>

              <div className="form-group">
                <label htmlFor="bio-form-inc">Annual / Monthly Income</label>
                <input type="text" id="bio-form-inc" value={income} onChange={(e) => setIncome(e.target.value)} />
              </div>
            </div>
          )}

          {activeFormTab === 'skills' && (
            <div className="flex flex-col gap-4 mt-2">
              <div className="form-group">
                <label htmlFor="bio-form-skill">Key Professional Skills (Comma list)</label>
                <input type="text" id="bio-form-skill" value={skills} onChange={(e) => setSkills(e.target.value)} />
              </div>

              <div className="form-group">
                <label htmlFor="bio-form-exp">Detailed Experience / Career Summary</label>
                <textarea id="bio-form-exp" rows={4} value={experience} onChange={(e) => setExperience(e.target.value)} />
              </div>
            </div>
          )}

        </div>

        {/* PAPER PRINT REVIEW PANEL COLUMN */}
        <div className="flex flex-col gap-4">
          
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-5 bg-white dark:bg-slate-900/40 shadow-sm max-h-[500px] overflow-y-auto">
            <h3 className="font-extrabold text-xs uppercase tracking-widest text-[#06B6D4] mb-3">Live Paper Preview (A4 layout)</h3>
            
            <div id="screen-preview-container" className="border border-gray-300 dark:border-gray-800 shadow rounded scale-90 origin-top bg-white text-gray-900 overflow-hidden" style={{ minHeight: '620px', color: '#1a1a1a' }}>
              
              {/* Traditional Marriage Template */}
              {template === 'traditional' && (
                <div className="p-6 font-serif border-[12px] border-double border-red-800 bg-[#fffdf0] text-red-900 select-none min-h-[600px]">
                  <div className="text-center mb-6">
                    <div className="text-3xl font-extrabold">ॐ</div>
                    <div className="text-xl font-bold tracking-widest uppercase border-b-2 border-red-800 inline-block px-3 pb-1 mt-1">Marriage Biodata</div>
                  </div>

                  <div className="mb-4">
                    <div className="font-bold text-xs uppercase border-b border-red-200 pb-0.5 mb-2 tracking-wide font-sans">Personal details</div>
                    <div className="grid grid-cols-3 gap-y-2 text-xs leading-relaxed font-serif">
                      <div className="font-bold">Full Name:</div>
                      <div className="col-span-2">{fullname}</div>
                      <div className="font-bold">Born DOB:</div>
                      <div className="col-span-2">{dob}</div>
                      <div className="font-bold">Height/Complexion:</div>
                      <div className="col-span-2">{height} / {complexion}</div>
                      <div className="font-bold">Family Address:</div>
                      <div className="col-span-2 text-[11px] leading-snug">{address}</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="font-bold text-xs uppercase border-b border-red-200 pb-0.5 mb-2 tracking-wide font-sans">Birth & Kundali details</div>
                    <div className="grid grid-cols-3 gap-y-2 text-xs leading-relaxed font-serif">
                      <div className="font-bold">Birth Time:</div>
                      <div className="col-span-2">{tob}</div>
                      <div className="font-bold">Birth Place:</div>
                      <div className="col-span-2">{pob}</div>
                      <div className="font-bold">Gotra / Rashi:</div>
                      <div className="col-span-2">{gotra}</div>
                      <div className="font-bold">Manglik or Not:</div>
                      <div className="col-span-2">{manglik}</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="font-bold text-xs uppercase border-b border-red-200 pb-0.5 mb-2 tracking-wide font-sans">Degrees & Profession</div>
                    <div className="grid grid-cols-3 gap-y-2 text-xs leading-relaxed font-serif">
                      <div className="font-bold">Education:</div>
                      <div className="col-span-2">{qualification}</div>
                      <div className="font-bold">College:</div>
                      <div className="col-span-2 text-[11px]">{college}</div>
                      <div className="font-bold">Current Work:</div>
                      <div className="col-span-2 text-[11px]">{occupation}</div>
                      <div className="font-bold">Annual Income:</div>
                      <div className="col-span-2">{income}</div>
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="font-bold text-xs uppercase border-b border-red-200 pb-0.5 mb-2 tracking-wide font-sans">Father / Family Background</div>
                    <div className="grid grid-cols-3 gap-y-2 text-xs leading-relaxed font-serif">
                      <div className="font-bold">Father:</div>
                      <div className="col-span-2">{father} ({fatherOcc})</div>
                      <div className="font-bold">Mother:</div>
                      <div className="col-span-2">{mother}</div>
                      <div className="font-bold">Siblings:</div>
                      <div className="col-span-2 text-[11px] leading-snug">{siblings}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modern Resume */}
              {template === 'modern' && (
                <div className="grid grid-cols-3 font-sans min-h-[600px] text-gray-800">
                  <div className="col-span-1 bg-slate-900 text-slate-100 p-4 flex flex-col gap-4 text-xs select-none">
                    <div className="w-16 h-16 rounded-full bg-slate-700 border-2 border-slate-600 mb-2 mx-auto"></div>
                    <div>
                      <h4 className="font-bold text-sm text-center leading-tight">{fullname}</h4>
                      <p className="text-[10px] text-blue-400 font-extrabold uppercase text-center mt-1">CS SDE Candidate</p>
                    </div>

                    <div className="border-t border-slate-800 pt-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-2">Connect Info</div>
                      <div className="flex flex-col gap-2 text-[10px]">
                        <div>📞 {phone}</div>
                        <div className="break-all">✉️ {email}</div>
                        <div className="leading-snug">📍 {address}</div>
                      </div>
                    </div>

                    <div className="border-t border-slate-800 pt-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-2">Technical Skills</div>
                      <p className="text-[10px] text-slate-300 leading-relaxed font-mono">{skills}</p>
                    </div>
                  </div>

                  <div className="col-span-2 p-5 bg-white select-none text-left">
                    <div className="mb-4">
                      <h3 className="font-bold text-sm text-gray-900 border-b-2 border-gray-200 pb-1 mb-2 uppercase">Education Profile</h3>
                      <div className="text-xs">
                        <div className="flex justify-between font-bold">
                          <span>{qualification}</span>
                          <span>NIT Institute</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5">{college}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h3 className="font-bold text-sm text-gray-900 border-b-2 border-gray-200 pb-1 mb-2 uppercase">Core Professional Journey</h3>
                      <div className="text-xs">
                        <div className="flex justify-between font-bold text-gray-900">
                          <span>{occupation}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">Corporate Software Solutions</p>
                        <p className="text-[11px] text-gray-600 leading-relaxed mt-2 italic bg-gray-50 p-2 rounded border-l-2 border-blue-500">{experience}</p>
                        <ul className="list-disc pl-4 text-[10px] text-gray-500 mt-2 space-y-1">
                          <li>Handled automated database registries migration offline-first.</li>
                          <li>Trained staff on advanced Excel analytics and reports statement templates.</li>
                          <li>Maintained active wallet entries tracking and balanced ledgers daily.</li>
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-gray-900 border-b-2 border-gray-200 pb-1 mb-2 uppercase">Family References</h3>
                      <div className="text-[11px] text-gray-500 leading-snug">
                        <strong>Father Profile:</strong> {father} ({fatherOcc}) <br />
                        <strong>Mother Details:</strong> {mother}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Classic Resume */}
              {template === 'classic' && (
                <div className="p-8 font-serif bg-white min-h-[600px] text-left">
                  <div className="text-center border-b-2 border-gray-900 pb-4 mb-5">
                    <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none uppercase">{fullname}</h1>
                    <p className="text-xs text-gray-500 mt-2 font-sans tracking-wide">
                      Email: {email} | Cell: {phone} <br />
                      Address: {address}
                    </p>
                  </div>

                  <div className="mb-5">
                    <h3 className="text-xs font-bold text-gray-950 uppercase border-b border-gray-300 pb-1 mb-2 tracking-widest font-sans">Academic Credentials</h3>
                    <div className="text-xs">
                      <div className="flex justify-between font-bold">
                        <span>{qualification}</span>
                        <span>Standard Distinction</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 italic">{college}</p>
                    </div>
                  </div>

                  <div className="mb-5">
                    <h3 className="text-xs font-bold text-gray-950 uppercase border-b border-gray-300 pb-1 mb-2 tracking-widest font-sans">Candidate Experience Chronology</h3>
                    <div className="text-xs">
                      <div className="flex justify-between font-bold">
                        <span>{occupation}</span>
                        <span>Active</span>
                      </div>
                      <p className="text-xs text-gray-650 leading-relaxed mt-2">{experience}</p>
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="text-xs font-bold text-gray-950 uppercase border-b border-gray-300 pb-1 mb-2 tracking-widest font-sans">Competency Toolkit</div>
                    <p className="text-xs leading-relaxed text-gray-700 italic font-mono">{skills}</p>
                  </div>
                </div>
              )}

            </div>
          </div>

          <button 
            type="button" 
            onClick={handlePrint}
            className="btn-primary flex items-center justify-center gap-2 py-3.5 mt-2"
          >
            <Printer className="w-5 h-5" />
            Compile & Launch PDF Print Job
          </button>

        </div>

      </div>

    </div>
  );
}
