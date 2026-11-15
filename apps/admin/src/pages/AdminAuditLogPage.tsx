import React, { useState, useEffect, useCallback } from 'react';
import {
  useAuth,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@abrainoconscious/ui';
import {
  formatDateIST,
  generateCsv,
  downloadCsv,
} from '@abrainoconscious/shared';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
  Lock,
  Download,
  Eye,
} from 'lucide-react';

interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
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

const PAGE_SIZE = 25;

export const AdminAuditLogPage: React.FC = () => {
  const { supabase, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all'); // all, today, 7d, 30d
  const [search, setSearch] = useState<string>('');

  // Selected Log for Modal Diff Inspection
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const fetchAuditLogs = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('audit_log')
        .select('*, actor:actor_id(full_name, email, role)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (actionFilter !== 'all') {
        query = query.ilike('action', `%${actionFilter}%`);
      }
      if (entityFilter !== 'all') {
        query = query.eq('entity', entityFilter);
      }
      if (roleFilter !== 'all') {
        query = query.eq('actor_role', roleFilter);
      }

      // Date filter
      if (dateFilter === 'today') {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        query = query.gte('created_at', startOfDay.toISOString());
      } else if (dateFilter === '7d') {
        const d = new Date(Date.now() - 7 * 86400000);
        query = query.gte('created_at', d.toISOString());
      } else if (dateFilter === '30d') {
        const d = new Date(Date.now() - 30 * 86400000);
        query = query.gte('created_at', d.toISOString());
      }

      if (search.trim()) {
        query = query.or(`entity_id.ilike.%${search.trim()}%,action.ilike.%${search.trim()}%`);
      }

      const { data, count, error } = await query;
      if (error) throw error;
      setLogs((data as unknown as AuditLogEntry[]) || []);
      setTotalCount(count || 0);
    } catch (err: unknown) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, isAdmin, page, actionFilter, entityFilter, roleFilter, dateFilter, search]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Export CSV with injection escaping
  const handleExportCsv = () => {
    if (logs.length === 0) return;
    const headers = ['ID', 'Date (IST)', 'Actor Name', 'Actor Role', 'Action', 'Entity', 'Entity ID', 'IP Address'];
    const rows = logs.map((l) => [
      l.id,
      formatDateIST(l.created_at),
      l.actor?.full_name || l.actor?.email || 'System',
      l.actor_role || 'system',
      l.action,
      l.entity,
      l.entity_id,
      l.ip_address || 'N/A',
    ]);
    const csvContent = generateCsv(headers, rows);
    downloadCsv(`audit_log_page${page}_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  if (!isAdmin) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 mb-3">
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
            Immutable record of all administrative program modifications, student block actions, and platform config changes.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={loading || logs.length === 0}
            className="flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" /> Export Page CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAuditLogs}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#1A373E] bg-[#081619] p-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8D9FA4]" />
          <input
            type="text"
            placeholder="Search by entity ID or action name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#8D9FA4]/60 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <select
          aria-label="Filter by Action"
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
        >
          <option value="all">All Actions</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
          <option value="student.">student.*</option>
          <option value="coupon.">coupon.*</option>
          <option value="team.">team.*</option>
          <option value="site_settings">site_settings.*</option>
        </select>

        <select
          aria-label="Filter by Entity"
          value={entityFilter}
          onChange={(e) => {
            setEntityFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
        >
          <option value="all">All Entities</option>
          <option value="programs">programs</option>
          <option value="program_sessions">program_sessions</option>
          <option value="profiles">profiles (students)</option>
          <option value="coupons">coupons</option>
          <option value="reviews">reviews</option>
          <option value="site_settings">site_settings</option>
          <option value="team_members">team_members</option>
        </select>

        <select
          aria-label="Filter by Role"
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
        >
          <option value="all">All Actor Roles</option>
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
          <option value="system">System / Trigger</option>
        </select>

        <select
          aria-label="Filter by Time"
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
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
            Administrative actions, student blocks, and catalog mutations will automatically appear here.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#1A373E] bg-[#081619] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#1A373E] bg-[#040C0E]/60 text-[#8D9FA4]">
                <tr>
                  <th className="py-3 px-4 font-medium">Timestamp (IST)</th>
                  <th className="py-3 px-4 font-medium">Action</th>
                  <th className="py-3 px-4 font-medium">Entity</th>
                  <th className="py-3 px-4 font-medium">Entity ID</th>
                  <th className="py-3 px-4 font-medium">Actor</th>
                  <th className="py-3 px-4 font-medium text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A373E]/60">
                {logs.map((entry) => {
                  const isCreate = entry.action.includes('CREATE') || entry.action.includes('insert');
                  const isDelete = entry.action.includes('DELETE') || entry.action.includes('remove') || entry.action.includes('revoke');
                  const actionColor = isCreate
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : isDelete
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30';

                  return (
                    <tr key={entry.id} className="hover:bg-[#0E2024]/40 transition-colors">
                      <td className="py-3 px-4 text-[#8D9FA4] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-amber-400" />
                          <span>{formatDateIST(entry.created_at)}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold ${actionColor}`}>
                          {entry.action}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-medium text-white">
                        {entry.entity}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-[#8D9FA4]">
                        {entry.entity_id}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-xs">
                          <User className="h-3 w-3 text-amber-400 shrink-0" />
                          <span className="text-white">
                            {entry.actor?.full_name || entry.actor?.email || 'System'}
                          </span>
                          {entry.actor_role && (
                            <span className="text-[10px] text-[#8D9FA4]">({entry.actor_role})</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(entry)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#1A373E] bg-[#0E2024] px-2.5 py-1 text-[11px] font-medium text-amber-300 hover:border-amber-500/50"
                        >
                          <Eye className="h-3 w-3" /> View Diff
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between border-t border-[#1A373E] px-4 py-3 text-xs text-[#8D9FA4]">
            <div>
              Showing {logs.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0} to{' '}
              {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} events
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </Button>
              <span className="px-2 text-white font-medium">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                className="flex items-center gap-1"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Structured Diff Modal */}
      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
          <DialogContent size="lg">
            <DialogHeader>
              <DialogTitle>Audit Event Detail & Diff</DialogTitle>
              <DialogDescription>
                Immutable event {selectedLog.id} for {selectedLog.entity} [{selectedLog.action}]
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#040C0E] p-3 rounded-xl border border-[#1A373E]">
                <div>
                  <span className="text-[#8D9FA4] block text-[10px]">Actor</span>
                  <span className="text-white font-medium">
                    {selectedLog.actor?.full_name || selectedLog.actor?.email || 'System'}
                  </span>
                </div>
                <div>
                  <span className="text-[#8D9FA4] block text-[10px]">Role</span>
                  <span className="text-amber-300 font-medium">{selectedLog.actor_role || 'system'}</span>
                </div>
                <div>
                  <span className="text-[#8D9FA4] block text-[10px]">Entity ID</span>
                  <span className="text-white font-mono text-[11px] truncate block">
                    {selectedLog.entity_id}
                  </span>
                </div>
                <div>
                  <span className="text-[#8D9FA4] block text-[10px]">Recorded At (IST)</span>
                  <span className="text-white">{formatDateIST(selectedLog.created_at)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-rose-400">Previous State (Old):</span>
                  <pre className="max-h-72 overflow-auto rounded-xl border border-rose-950/60 bg-[#040C0E] p-3 font-mono text-[11px] text-rose-300">
                    {selectedLog.diff?.old
                      ? JSON.stringify(selectedLog.diff.old, null, 2)
                      : '// No previous state (Record Created)'}
                  </pre>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-emerald-400">Updated State (New):</span>
                  <pre className="max-h-72 overflow-auto rounded-xl border border-emerald-950/60 bg-[#040C0E] p-3 font-mono text-[11px] text-emerald-300">
                    {selectedLog.diff?.new
                      ? JSON.stringify(selectedLog.diff.new, null, 2)
                      : '// Record Deleted'}
                  </pre>
                </div>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
