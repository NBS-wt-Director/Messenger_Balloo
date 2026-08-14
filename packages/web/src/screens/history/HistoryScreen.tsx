// HistoryScreen — лента версий (timeline)
// Тикет №56 — History: changelog (узел 05)
// Макет: mockups/history-balloo-su/version-list.html

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HistoryTimeline } from './HistoryTimeline';
import { api } from '@/services/api';

interface VersionItem {
  id: string;
  version: string;
  publishedAt: number;
  isLatest: boolean;
  createdAt: number;
  title: string;
  icon: string;
  type: string;
  status: string;
  summary: string;
  expectedAt?: string;
}

const TABS = [
  { key: 'all', label: 'Все' },
  { key: 'released', label: 'Релизы' },
  { key: 'planned', label: 'В планах' },
];

export function HistoryScreen() {
  const navigate = useNavigate();

  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const loadVersions = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getHistoryVersions(
        activeTab !== 'all' ? { status: activeTab } : undefined
      );
      setVersions(result.items || []);
    } catch (error) {
      console.error('Ошибка загрузки версий:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  return (
    <div className="main">
      <div className="content overflow-y-auto">
        <div className="page-container">
          <h1 className="page-title">📜 История версий</h1>
          <p className="page-subtitle">Все версии мессенджера Balloo — от первой до планируемых</p>

          {/* Tabs */}
          <div className="tabs mb-6" data-tab-group="versions">
            {TABS.map((tab) => (
              <div
                key={tab.key}
                className={`tab ${activeTab === tab.key ? 'tab--active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
                style={{ cursor: 'pointer' }}
              >
                {tab.label}
              </div>
            ))}
          </div>

          {/* Timeline / список версий */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="spinner" />
            </div>
          ) : (
            <HistoryTimeline
              versions={versions}
              onSelect={(v) => navigate(`/history/version/${v.id}`)}
            />
          )}

          {/* CTA — скачать */}
          <div className="text-center mt-6">
            <button
              className="btn btn--secondary btn--lg"
              onClick={() => navigate('/download')}
            >
              ⬇️ Скачать последнюю версию
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
