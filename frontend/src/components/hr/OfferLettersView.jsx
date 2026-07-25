import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { FiSend, FiFileText, FiDownload, FiEdit3, FiPlus, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import API, { getErrorMessage } from '../../api';

const OfferLettersView = () => {
  const [offers, setOffers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [editingBody, setEditingBody] = useState('');

  const fetchOffersAndTemplates = async () => {
    setLoading(true);
    try {
      const [offRes, tempRes] = await Promise.all([
        API.get('/offers/list').catch(() => ({ data: [] })),
        API.get('/offers/templates').catch(() => ({ data: [] }))
      ]);
      setOffers(offRes.data || []);
      setTemplates(tempRes.data || []);
      if (offRes.data && offRes.data.length > 0) {
        setSelectedOffer(offRes.data[0]);
        setEditingBody(offRes.data[0].offer_body || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffersAndTemplates();
  }, []);

  const handleApplyTemplate = (templateText) => {
    if (!selectedOffer) return;
    const formatted = templateText
      .replace('{date}', new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }))
      .replace('{candidate_name}', selectedOffer.candidate_name || 'Candidate Name')
      .replace('{job_title}', selectedOffer.job_title || 'Position Title')
      .replace('{salary}', selectedOffer.salary || '$120,000 / year')
      .replace('{joining_date}', selectedOffer.joining_date || '1st of Next Month');
    setEditingBody(formatted);
    toast.success('Template applied to editor!');
  };

  const handleSaveEdit = async () => {
    if (!selectedOffer) return;
    try {
      await API.patch(`/offers/${selectedOffer.id}`, { offer_body: editingBody });
      toast.success('Offer letter updated successfully!');
      fetchOffersAndTemplates();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update offer letter'));
    }
  };

  const handleDownload = (offer) => {
    const element = document.createElement('a');
    const file = new Blob([editingBody || offer.offer_body], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Offer_Letter_${(offer.candidate_name || 'Candidate').replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Downloaded text format!');
  };

  const handleDownloadDocx = async (offer) => {
    try {
      const response = await API.get(`/offers/${offer.id}/download-docx`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Offer_Letter_${(offer.candidate_name || 'Candidate').replace(/\s+/g, '_')}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Downloaded Word Document (.docx)!');
    } catch (err) {
      toast.error('Failed to download Word Document (.docx)');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <FiSend className="text-indigo-600 dark:text-indigo-400" />
            <span>Offer Letter Management Agent</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Auto-generate, review, edit, and download official candidate offer letters.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List of Generated Offers */}
        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider text-[11px] text-gray-400">
            Generated Offer Letters ({offers.length})
          </h2>

          {loading ? (
            <p className="text-xs text-gray-400 py-4 text-center">Loading offer letters...</p>
          ) : offers.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <FiFileText className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-xs text-gray-500">No offer letters generated yet.</p>
              <p className="text-[10px] text-gray-400">Generate offer letters directly under Applicants view.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {offers.map((off) => (
                <button
                  key={off.id}
                  onClick={() => {
                    setSelectedOffer(off);
                    setEditingBody(off.offer_body || '');
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition cursor-pointer space-y-1 ${
                    selectedOffer?.id === off.id
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800'
                      : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-gray-900 dark:text-white">{off.candidate_name}</span>
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                      {off.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">{off.job_title}</p>
                  <p className="text-[10px] text-indigo-500 font-mono">{off.salary} • {off.joining_date}</p>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Right 2 Columns: Offer Preview & Editor */}
        <Card className="lg:col-span-2 p-6 space-y-4">
          {selectedOffer ? (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Offer Letter — {selectedOffer.candidate_name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Role: {selectedOffer.job_title} | Candidate: {selectedOffer.candidate_email}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {/* Template Preset Dropdown */}
                  {templates.length > 0 && (
                    <select
                      onChange={(e) => {
                        const tmpl = templates.find(t => t.id === e.target.value);
                        if (tmpl) handleApplyTemplate(tmpl.template_text);
                      }}
                      defaultValue=""
                      className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-700 dark:text-gray-200"
                    >
                      <option value="" disabled>Load Sample Template...</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  )}

                  <Button size="sm" variant="outline" onClick={() => handleDownloadDocx(selectedOffer)}>
                    <FiDownload className="mr-1.5" /> Download (.docx)
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDownload(selectedOffer)}>
                    <FiDownload className="mr-1.5" /> Download (.txt)
                  </Button>
                  <Button size="sm" variant="outline" onClick={async () => {
                    try {
                      await API.post(`/offers/send/${selectedOffer.id}`);
                      toast.success(`Offer email sent to ${selectedOffer.candidate_email}!`);
                      fetchOffersAndTemplates();
                    } catch (err) {
                      toast.error('Failed to send offer email');
                    }
                  }}>
                    <FiSend className="mr-1.5" /> Send Email
                  </Button>
                  <Button size="sm" onClick={handleSaveEdit}>
                    <FiCheck className="mr-1.5" /> Save Changes
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Offer Letter Content Editor (Markdown/Text)
                </label>
                <textarea
                  rows={16}
                  value={editingBody}
                  onChange={(e) => setEditingBody(e.target.value)}
                  className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-900 dark:text-white leading-relaxed"
                />
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-gray-400 space-y-2">
              <FiEdit3 className="w-10 h-10 mx-auto text-gray-300" />
              <p className="text-sm font-semibold">Select an offer letter on the left to preview or edit.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default OfferLettersView;
