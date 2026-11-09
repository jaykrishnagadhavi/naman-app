import React, { useState, useEffect, useCallback } from 'react';
import {
  useAuth,
  Badge,
  Button,
} from '@abrainoconscious/ui';
import { formatDateIST } from '@abrainoconscious/shared';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  User,
  Clock,
  Code,
  Lock,
} from 'lucide-react';

interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  actor_role: string | null;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | string;
  entity: string;
  entity_id: string;
  diff: {
    old?: Record<string, unknown>;
    new?: Record<string, unknown>;
  };
  ip_address: string | null;
  created_at: string;
  actor?: {
    full_name: string | null;
    email: string | null;
    role: string | null;
  } | null;
}

export const AdminAuditLogPage: React.FC = () => {
  const { supabase, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const fetchAuditLogs = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      let query = supabase
        .from('audit_log')
        .select('*, actor:actor_id(full_name, email, role)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }
      if (entityFilter !== 'all') {
        query = query.eq('entity', entityFilter);
      }
      if (search.trim()) {
        query = query.ilike('entity_id', `%${search.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs((data as unknown as AuditLogEntry[]) || []);
    } catch (err: unknown) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, isAdmin, actionFilter, entityFilter, search]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  if (!isAdmin) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 mb-3">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="font-serif text-xl font-bold text-white">Access Restricted</h2>
        <p className="mt-1 max-w-sm text-xs text-[#8D9FA4]">
          The administrative audit trail is restricted to Super Administrators only. Staff accounts do
          not have permission to inspect system audit logs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold text-white">Audit Log</h1>
            <Badge variant="amber">Security & Compliance</Badge>
          </div>
          <p className="text-xs text-[#8D9FA4]">
            Immutable record of all administrative program modifications, creations, and deletions.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAuditLogs}
          disabled={loading}
          className="flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Log
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#1A373E] bg-[#081619] p-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8D9FA4]" />
          <input
            type="text"
            placeholder="Search by entity ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#8D9FA4]/60 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <select
          aria-label="Filter by Action"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
        >
          <option value="all">All Actions</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
        </select>

        <select
          aria-label="Filter by Entity"
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
        >
          <option value="all">All Entities</option>
          <option value="programs">programs</option>
          <option value="enrollments">enrollments</option>
          <option value="coupons">coupons</option>
        </select>
      </div>

      {/* Log Entries Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-16 w-full animate-pulse rounded-xl border border-[#1A373E] bg-[#081619]"
            />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#1A373E] bg-[#081619] p-12 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-[#8D9FA4]/50 mb-3" />
          <h3 className="font-serif text-sm font-bold text-white">No Audit Events Recorded</h3>
          <p className="mt-1 text-xs text-[#8D9FA4]">
            Modifications made to programs or catalog resources will automatically appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((entry) => {
            const isExpanded = expandedIds.includes(entry.id);
            const actionColor =
              entry.action === 'CREATE'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : entry.action === 'UPDATE'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : 'bg-red-500/20 text-red-400 border-red-500/30';

            return (
              <div
                key={entry.id}
                className="overflow-hidden rounded-xl border border-[#1A373E] bg-[#081619] transition-colors hover:border-[#2C525A]"
              >
                <div
                  onClick={() => toggleExpand(entry.id)}
                  className="flex cursor-pointer items-center justify-between p-3.5 text-xs select-none"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="text-[#8D9FA4] hover:text-white"
                      aria-label="Toggle diff expansion"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>

                    <span
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${actionColor}`}
                    >
                      {entry.action}
                    </span>

                    <span className="font-mono text-white font-semibold">{entry.entity}</span>

                    <span className="font-mono text-[11px] text-[#8D9FA4] hidden sm:inline">
                      ID: {entry.entity_id}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-[#8D9FA4] text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3 text-amber-400" />
                      <span className="text-white">
                        {entry.actor?.full_name || entry.actor?.email || 'System Trigger'}
                      </span>
                      {entry.actor_role && (
                        <span className="text-[10px] text-[#8D9FA4]">({entry.actor_role})</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDateIST(entry.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Expanded Diff Viewer */}
                {isExpanded && (
                  <div className="border-t border-[#1A373E] bg-[#040C0E] p-4 text-xs space-y-3">
                    <div className="flex items-center gap-2 text-[#8D9FA4]">
                      <Code className="h-3.5 w-3.5 text-amber-400" />
                      <span className="font-semibold text-white">Event Payload & Diff:</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {entry.diff.old && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-red-400">
                            Previous State (Old):
                          </span>
                          <pre className="max-h-64 overflow-auto rounded-lg border border-[#1A373E] bg-[#081619] p-3 font-mono text-[11px] text-[#8D9FA4]">
                            {JSON.stringify(entry.diff.old, null, 2)}
                          </pre>
                        </div>
                      )}

                      {entry.diff.new && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-emerald-400">
                            Updated State (New):
                          </span>
                          <pre className="max-h-64 overflow-auto rounded-lg border border-[#1A373E] bg-[#081619] p-3 font-mono text-[11px] text-emerald-300/90">
                            {JSON.stringify(entry.diff.new, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
