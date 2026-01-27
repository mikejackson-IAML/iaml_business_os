'use client';

import { useState, useEffect } from 'react';

interface VersionEntry {
  id: string;
  version: number;
  created_at: string;
}

interface DocVersionSelectorProps {
  projectId: string;
  docType: string;
  currentVersion: number;
  onVersionSelect: (version: { id: string; version: number }) => void;
}

function formatVersionDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function DocVersionSelector({
  projectId,
  docType,
  currentVersion,
  onVersionSelect,
}: DocVersionSelectorProps) {
  const [versions, setVersions] = useState<VersionEntry[]>([]);

  useEffect(() => {
    // Use a placeholder docId since the route uses query params for version listing
    fetch(
      `/api/planning/documents/_list?projectId=${projectId}&docType=${docType}&version=all`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.versions) setVersions(data.versions);
      })
      .catch(console.error);
  }, [projectId, docType, currentVersion]);

  if (versions.length <= 1) return null;

  return (
    <select
      value={currentVersion}
      onChange={(e) => {
        const ver = parseInt(e.target.value, 10);
        const entry = versions.find((v) => v.version === ver);
        if (entry) onVersionSelect({ id: entry.id, version: entry.version });
      }}
      className="text-xs bg-background border border-border rounded px-2 py-1 text-foreground"
    >
      {versions.map((v) => (
        <option key={v.id} value={v.version}>
          Version {v.version} — {formatVersionDate(v.created_at)}
        </option>
      ))}
    </select>
  );
}
