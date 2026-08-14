// SpecifityScreen — спецификация экрана (split-view: описание + превью макета)
// Тикет №59 — Specifity: спецификация (узел 10 — specifity.balloo.su)
// Макет: mockups/specifity-balloo-su/specification.html

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import './specifity.css';
import { ResizableSplit } from './components/ResizableSplit';
import { NodeSelector, type SpecNodeOption } from './components/NodeSelector';
import { ScreenSelector, type SpecScreenOption } from './components/ScreenSelector';
import { SpecPanel, type SpecData } from './components/SpecPanel';
import { PreviewPanel } from './components/PreviewPanel';

// Базовый URL к макетам (dev: через Vite proxy или прямой путь)
const MOCKUPS_BASE =
  import.meta.env.VITE_MOCKUPS_URL || '/mockups';

export function SpecifityScreen() {
  const { nodeId: paramNodeId, screenId: paramScreenId } = useParams<{
    nodeId?: string;
    screenId?: string;
  }>();
  const navigate = useNavigate();

  const [nodes, setNodes] = useState<SpecNodeOption[]>([]);
  const [screens, setScreens] = useState<SpecScreenOption[]>([]);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(paramNodeId || null);
  const [activeScreenId, setActiveScreenId] = useState<string | null>(paramScreenId || null);
  const [spec, setSpec] = useState<SpecData | null>(null);
  const [loading, setLoading] = useState(true);
  const [specLoading, setSpecLoading] = useState(false);

  // --- Загрузка списка узлов ---
  useEffect(() => {
    setLoading(true);
    api
      .getSpecs()
      .then((data) => {
        setNodes(data.nodes || []);
        // Если нет активного узла из URL — выбираем первый
        if (!activeNodeId && data.nodes.length > 0) {
          setActiveNodeId(data.nodes[0].id);
        }
      })
      .catch((err) => console.error('Ошибка загрузки specs:', err))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Обновление списка экранов при смене узла ---
  useEffect(() => {
    const node = nodes.find((n) => n.id === activeNodeId);
    setScreens(node ? (node as any).screens || [] : []);
    // Если текущий экран не принадлежит узлу — сброс
    if (node && activeScreenId) {
      const belongs = (node as any).screens?.some((s: any) => s.id === activeScreenId);
      if (!belongs) setActiveScreenId(null);
    }
  }, [activeNodeId, nodes, activeScreenId]);

  // --- Загрузка спецификации экрана ---
  useEffect(() => {
    if (!activeNodeId || !activeScreenId) {
      setSpec(null);
      return;
    }
    setSpecLoading(true);
    api
      .getSpec(activeNodeId, activeScreenId)
      .then((data) => setSpec(data))
      .catch((err) => {
        console.error('Ошибка загрузки spec:', err);
        setSpec(null);
      })
      .finally(() => setSpecLoading(false));
  }, [activeNodeId, activeScreenId]);

  // --- Обновление URL при смене узла/экрана ---
  const handleNodeSelect = useCallback(
    (nodeId: string) => {
      setActiveNodeId(nodeId);
      setActiveScreenId(null);
      navigate('/spec');
    },
    [navigate]
  );

  const handleScreenSelect = useCallback(
    (screenId: string) => {
      setActiveScreenId(screenId);
      if (activeNodeId) {
        navigate(`/spec/${activeNodeId}/${screenId}`);
      }
    },
    [activeNodeId, navigate]
  );

  // --- URL макета для iframe ---
  const mockupUrl = spec ? `${MOCKUPS_BASE}/${spec.mockupUrl}` : null;

  // --- Левая панель: селекторы + спецификация ---
  const leftPanel = (
    <div className="spec-left-panel">
      <NodeSelector nodes={nodes} activeNodeId={activeNodeId} onSelect={handleNodeSelect} />
      <ScreenSelector
        screens={screens}
        activeScreenId={activeScreenId}
        onSelect={handleScreenSelect}
      />
      <SpecPanel spec={spec} loading={specLoading} />
    </div>
  );

  // --- Правая панель: превью макета ---
  const rightPanel = <PreviewPanel mockupUrl={mockupUrl} />;

  return (
    <div className="specifity-screen">
      <div className="specifity-screen__topbar">
        <div className="specifity-screen__logo">
          <div className="specifity-screen__logo-icon">📐</div>
          <span>Specifity</span>
        </div>
        <div className="specifity-screen__title">Спецификация экрана (split-view)</div>
        <div className="specifity-screen__right">
          {loading ? (
            <span className="specifity-screen__loading">Загрузка…</span>
          ) : (
            <span className="specifity-screen__info">
              {nodes.length} узлов ·{' '}
              {nodes.reduce((s, n) => s + n.screenCount, 0)} экранов
            </span>
          )}
        </div>
      </div>

      <div className="specifity-screen__main">
        <ResizableSplit left={leftPanel} right={rightPanel} />
      </div>
    </div>
  );
}

export default SpecifityScreen;
