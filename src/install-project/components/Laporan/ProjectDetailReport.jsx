import React from 'react';
import ProgressPerUnit from '../DetailInstall/ProgressPerUnit';

export default function ProjectDetailReport({ reportData }) {
  if (!reportData || reportData.length === 0) return null;

  return (
    <>
      {reportData.map((project, idx) => (
        <div key={idx} className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-5 flex items-center justify-between text-white">
            <div>
                <h3 className="font-bold text-xl">{project.no_project} - {project.nama}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-blue-100 opacity-90">
                  <span>Customer: {project.customer || '-'}</span>
                  <span>•</span>
                  <span>Leader: {project.leader || '-'}</span>
                  <span>•</span>
                  <span>Durasi: {project.durasi_hari} Hari</span>
                </div>
            </div>
            <div className="text-right">
                <div className="text-sm text-blue-100">Status</div>
                <div className="font-semibold uppercase tracking-wider text-green-300">
                  {project.status === 'running' ? 'Berjalan' : project.status}
                </div>
            </div>
          </div>
          
          {/* Rincian Progress Area & Unit & Scope */}
          <div className="p-6">
              <h4 className="font-bold text-gray-800 mb-4 text-lg border-b pb-2">Rincian Progress Pekerjaan</h4>
              
              <div className="mb-8">
                <ProgressPerUnit project={project} />
              </div>

            {project.areas && project.areas.length > 0 ? (
              <div className="space-y-6">
                {project.areas.map((area, aIdx) => (
                  <div key={aIdx} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-100 px-4 py-3 font-semibold text-slate-800 border-b border-gray-200 flex justify-between items-center">
                          <span>Area: {area.nama}</span>
                          <span className="text-sm font-normal text-slate-500">Bobot Area: {area.bobot}%</span>
                      </div>
                      
                      {area.units && area.units.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                          {area.units.map((unit, uIdx) => (
                            <div key={uIdx} className="bg-white">
                              <div className="px-4 py-3 bg-gray-50 flex justify-between items-center flex-wrap gap-2">
                                  <div className="font-medium text-gray-900">Unit: {unit.nama}</div>
                                  <div className="flex gap-4 text-sm text-gray-600">
                                    <span>Target: {unit.target_start || '-'} s.d {unit.target_finish || '-'}</span>
                                    <span>Bobot Unit: {unit.bobot}%</span>
                                    <span className="font-bold text-blue-600">Capaian Unit: {unit.capaian_unit || 0}%</span>
                                  </div>
                              </div>
                              
                              {/* Scope Table */}
                              <div className="overflow-x-auto p-4">
                                  <table className="w-full text-sm text-left border border-gray-100">
                                    <thead className="bg-blue-50 text-blue-900 text-xs uppercase">
                                        <tr>
                                          <th className="px-4 py-2 font-semibold">Scope of Work</th>
                                          <th className="px-4 py-2 font-semibold text-center w-24">Tipe</th>
                                          <th className="px-4 py-2 font-semibold text-right w-24">Bobot (Unit)</th>
                                          <th className="px-4 py-2 font-semibold text-right w-24">Bobot (Proj)</th>
                                          <th className="px-4 py-2 font-semibold text-right w-32">Actual Capaian</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {unit.scopes && unit.scopes.length > 0 ? (
                                          unit.scopes.map((scope, sIdx) => (
                                            <tr key={sIdx} className="hover:bg-blue-50/30">
                                                <td className="px-4 py-2 text-gray-800">
                                                  {scope.nama_scope}
                                                  {scope.tipe === 'additional' && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700 font-medium">Additional</span>}
                                                </td>
                                                <td className="px-4 py-2 text-center text-gray-500 capitalize">{scope.tipe}</td>
                                                <td className="px-4 py-2 text-right text-gray-500">{scope.bobot_unit}%</td>
                                                <td className="px-4 py-2 text-right text-gray-500">{scope.bobot_project}%</td>
                                                <td className="px-4 py-2 text-right font-semibold text-blue-600">{scope.capaian}%</td>
                                            </tr>
                                          ))
                                        ) : (
                                          <tr><td colSpan="5" className="px-4 py-3 text-center text-gray-400">Belum ada scope</td></tr>
                                        )}
                                    </tbody>
                                  </table>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-sm text-gray-500">Belum ada unit</div>
                      )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">Belum ada data area/unit untuk project ini.</div>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
