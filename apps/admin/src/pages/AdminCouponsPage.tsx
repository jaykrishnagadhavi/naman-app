import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useAuth,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  Badge,
  ErrorDetailsAlert,
} from '@abrainoconscious/ui';
import {
  formatDateIST,
  formatPaise,
  rupeesToPaise,
  paiseToRupees,
  validateCouponCode,
  CouponFormSchema,
  type CouponFormValues,
} from '@abrainoconscious/shared';
import {
  Tag,
  Plus,
  RefreshCw,
  Search,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Play,
  Lock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

export const AdminCouponsPage: React.FC = () => {
  const { supabase, profile } = useAuth();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [simulatorModalOpen, setSimulatorModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Coupon Editor Form States
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'flat'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(20);
  const [maxUses, setMaxUses] = useState<string>('');
  const [perUserLimit, setPerUserLimit] = useState<number>(1);
  const [validFrom, setValidFrom] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [validUntil, setValidUntil] = useState<string>('');
  const [applicablePrograms, setApplicablePrograms] = useState<string[]>([]);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Coupon Simulator States
  const [simProgramId, setSimProgramId] = useState<string>('');
  const [simCode, setSimCode] = useState<string>('');
  const [simResult, setSimResult] = useState<any>(null);
  const [simLoading, setSimLoading] = useState<boolean>(false);

  // 1. RBAC Guard: Admin Only
  if (profile && profile.role !== 'admin') {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center text-white">
        <div className="max-w-md rounded-2xl border border-rose-500/30 bg-[#081619] p-8 shadow-2xl space-y-4">
          <div className="h-12 w-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-white">Administrator Access Required</h2>
          <p className="text-xs text-[#8D9FA4] leading-relaxed">
            The promotional discount coupons engine is restricted exclusively to Administrators. Staff members do not have permission to view or manage discount rules.
          </p>
        </div>
      </div>
    );
  }

  // 2. Fetch Coupons List
  const {
    data: coupons = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['admin-coupons-list'],
    queryFn: async () => {
      const { data, error: cErr } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (cErr) throw cErr;
      return data || [];
    },
    staleTime: 1000 * 30,
  });

  // 3. Fetch Programs for Dropdowns
  const { data: programs = [] } = useQuery({
    queryKey: ['admin-programs-lookup'],
    queryFn: async () => {
      const { data, error: prErr } = await supabase
        .from('programs')
        .select('id, title, slug, price_paise')
        .is('deleted_at', null)
        .order('title', { ascending: true });
      if (prErr) throw prErr;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Save / Upsert Coupon Mutation
  const saveCouponMutation = useMutation({
    mutationFn: async () => {
      setFormError(null);

      // Value conversion: If flat, value entered in Rupees is stored in Paise
      const valPaise = discountType === 'flat' ? rupeesToPaise(Number(discountValue)) : Number(discountValue);

      // Validate with Zod
      const validated: CouponFormValues = CouponFormSchema.parse({
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        value: discountType === 'flat' ? valPaise : Number(discountValue),
        max_uses: maxUses ? parseInt(maxUses, 10) : null,
        per_user_limit: perUserLimit,
        valid_from: new Date(validFrom).toISOString(),
        valid_until: validUntil ? new Date(validUntil).toISOString() : null,
        applicable_program_ids: applicablePrograms,
        is_active: isActive,
      });

      if (editingCoupon) {
        // Update existing coupon
        const { error: updErr } = await supabase
          .from('coupons')
          .update({
            code: validated.code,
            discount_type: validated.discount_type,
            value: validated.value,
            max_uses: validated.max_uses,
            per_user_limit: validated.per_user_limit,
            valid_from: validated.valid_from,
            valid_until: validated.valid_until,
            applicable_program_ids: validated.applicable_program_ids.length > 0 ? validated.applicable_program_ids : null,
            is_active: validated.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingCoupon.id);

        if (updErr) throw updErr;

        // Audit Log
        await supabase.from('audit_log').insert({
          actor_id: profile?.id,
          actor_role: 'admin',
          action: 'coupon.update',
          entity: 'coupons',
          entity_id: editingCoupon.id,
          diff: validated,
        });
      } else {
        // Create new coupon
        const { data: newCoupon, error: insErr } = await supabase
          .from('coupons')
          .insert({
            code: validated.code,
            discount_type: validated.discount_type,
            value: validated.value,
            max_uses: validated.max_uses,
            per_user_limit: validated.per_user_limit,
            valid_from: validated.valid_from,
            valid_until: validated.valid_until,
            applicable_program_ids: validated.applicable_program_ids.length > 0 ? validated.applicable_program_ids : null,
            is_active: validated.is_active,
          })
          .select()
          .single();

        if (insErr) throw insErr;

        // Audit Log
        await supabase.from('audit_log').insert({
          actor_id: profile?.id,
          actor_role: 'admin',
          action: 'coupon.create',
          entity: 'coupons',
          entity_id: newCoupon.id,
          diff: validated,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons-list'] });
      setEditorModalOpen(false);
      resetEditorForm();
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to save coupon.');
    },
  });

  // Toggle Active Status Mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: boolean }) => {
      const { error: tErr } = await supabase
        .from('coupons')
        .update({ is_active: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (tErr) throw tErr;

      await supabase.from('audit_log').insert({
        actor_id: profile?.id,
        actor_role: 'admin',
        action: 'coupon.toggle_active',
        entity: 'coupons',
        entity_id: id,
        diff: { is_active: newStatus },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons-list'] });
    },
  });

  const resetEditorForm = () => {
    setEditingCoupon(null);
    setCode('');
    setDiscountType('percent');
    setDiscountValue(20);
    setMaxUses('');
    setPerUserLimit(1);
    setValidFrom(new Date().toISOString().slice(0, 16));
    setValidUntil('');
    setApplicablePrograms([]);
    setIsActive(true);
    setFormError(null);
  };

  const handleOpenCreate = () => {
    resetEditorForm();
    generateRandomCode();
    setEditorModalOpen(true);
  };

  const handleOpenEdit = (c: any) => {
    setEditingCoupon(c);
    setCode(c.code);
    setDiscountType(c.discount_type);
    setDiscountValue(
      c.discount_type === 'flat' ? paiseToRupees(c.value) : c.value
    );
    setMaxUses(c.max_uses ? String(c.max_uses) : '');
    setPerUserLimit(c.per_user_limit || 1);
    setValidFrom(c.valid_from ? new Date(c.valid_from).toISOString().slice(0, 16) : '');
    setValidUntil(c.valid_until ? new Date(c.valid_until).toISOString().slice(0, 16) : '');
    setApplicablePrograms(c.applicable_program_ids || []);
    setIsActive(c.is_active);
    setFormError(null);
    setEditorModalOpen(true);
  };

  const handleDuplicate = (c: any) => {
    resetEditorForm();
    setCode(`${c.code}_COPY`);
    setDiscountType(c.discount_type);
    setDiscountValue(c.discount_type === 'flat' ? paiseToRupees(c.value) : c.value);
    setMaxUses(c.max_uses ? String(c.max_uses) : '');
    setPerUserLimit(c.per_user_limit || 1);
    setValidFrom(new Date().toISOString().slice(0, 16));
    setValidUntil(c.valid_until ? new Date(c.valid_until).toISOString().slice(0, 16) : '');
    setApplicablePrograms(c.applicable_program_ids || []);
    setIsActive(true);
    setEditorModalOpen(true);
  };

  const generateRandomCode = () => {
    const prefixes = ['GROWTH', 'MINDSET', 'NAMAN', 'FOCUS', 'ELEVATE', 'STUDIO'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(10 + Math.random() * 90);
    setCode(`${prefix}${num}`);
  };

  const handleCopy = (couponCode: string) => {
    navigator.clipboard.writeText(couponCode);
    setCopiedCode(couponCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleRunSimulator = async () => {
    if (!simProgramId || !simCode) return;
    setSimLoading(true);
    try {
      const res = await validateCouponCode(supabase, {
        code: simCode.trim(),
        programId: simProgramId,
        userId: profile?.id,
      });
      setSimResult(res);
    } catch (err: any) {
      setSimResult({ valid: false, message: err.message || 'Simulation execution failed' });
    } finally {
      setSimLoading(false);
    }
  };

  // Filter coupons by search
  const filteredCoupons = coupons.filter((c: any) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return c.code.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1A373E] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="h-6 w-6 text-amber-500" />
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              Promotional Coupons
            </h1>
          </div>
          <p className="text-xs text-[#8D9FA4] mt-1">
            Create promotional discount codes, manage redemption caps, and simulate pricing rules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="border-[#1A373E] bg-[#0E2024] text-xs text-[#8D9FA4] hover:text-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSimProgramId(programs[0]?.id || '');
              setSimCode('');
              setSimResult(null);
              setSimulatorModalOpen(true);
            }}
            className="border-amber-500/40 bg-amber-500/10 text-xs text-amber-300 hover:bg-amber-500 hover:text-black font-semibold"
          >
            <Play className="h-3.5 w-3.5 mr-1.5" />
            <span>Test this coupon</span>
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            <span>Create Coupon</span>
          </Button>
        </div>
      </div>

      {/* Informational Callout */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-white">Payments On-Hold Notice</div>
          <p className="mt-0.5 text-amber-200/90 leading-relaxed">
            Payment processing is currently on hold. Coupons created here are fully saved and testable with the simulation tool. They will automatically take active effect during student checkout when payments go live.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="rounded-xl border border-[#1A373E] bg-[#081619] p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8D9FA4]" />
          <input
            type="text"
            placeholder="Search coupon codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#1A373E] bg-[#0E2024] pl-9 pr-3 py-2 text-xs text-white placeholder-[#8D9FA4] focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* Error Alert */}
      {isError && (
        <div className="space-y-2">
          <ErrorDetailsAlert
            title="Failed to Load Coupons"
            error={error}
          />
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry Loading
          </Button>
        </div>
      )}

      {/* Coupons Table */}
      <div className="overflow-hidden rounded-xl border border-[#1A373E] bg-[#081619]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#1A373E] bg-[#0E2024]/60 text-[#8D9FA4]">
              <tr>
                <th className="py-3 px-4 font-semibold">Coupon Code</th>
                <th className="py-3 px-4 font-semibold">Discount Rule</th>
                <th className="py-3 px-4 font-semibold">Redemptions / Cap</th>
                <th className="py-3 px-4 font-semibold">Validity Period (IST)</th>
                <th className="py-3 px-4 font-semibold">Target Cohorts</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A373E]/50 text-white">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8D9FA4]">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-amber-500" />
                    <span>Loading discount coupons...</span>
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8D9FA4]">
                    <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <div className="font-semibold text-white">No coupons found</div>
                    <div className="text-[11px] mt-1">
                      Create your first promotional discount coupon using the button above.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon: any) => {
                  const isExpired =
                    coupon.valid_until && new Date(coupon.valid_until).getTime() < Date.now();
                  return (
                    <tr key={coupon.id} className="hover:bg-[#0E2024]/40 transition-colors">
                      {/* Code */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {coupon.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(coupon.code)}
                            className="text-[#8D9FA4] hover:text-white"
                            title="Copy Code"
                          >
                            {copiedCode === coupon.code ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Discount Value */}
                      <td className="py-3.5 px-4 font-semibold">
                        {coupon.discount_type === 'percent' ? (
                          <span className="text-white">{coupon.value}% OFF</span>
                        ) : (
                          <span className="text-white">{formatPaise(coupon.value)} OFF</span>
                        )}
                      </td>

                      {/* Uses / Cap */}
                      <td className="py-3.5 px-4 text-[#8D9FA4]">
                        <span>{coupon.used_count || 0}</span>
                        <span> / </span>
                        <span>{coupon.max_uses ? coupon.max_uses : '∞ Unlimited'}</span>
                        <div className="text-[10px] text-[#8D9FA4] mt-0.5">
                          Limit: {coupon.per_user_limit || 1} per student
                        </div>
                      </td>

                      {/* Validity (IST) */}
                      <td className="py-3.5 px-4 text-[#8D9FA4] whitespace-nowrap">
                        <div>From: {formatDateIST(coupon.valid_from)}</div>
                        <div>To: {coupon.valid_until ? formatDateIST(coupon.valid_until) : 'No Expiry'}</div>
                      </td>

                      {/* Applicable Programs */}
                      <td className="py-3.5 px-4">
                        {coupon.applicable_program_ids && coupon.applicable_program_ids.length > 0 ? (
                          <span className="text-amber-400/90 text-[11px]">
                            {coupon.applicable_program_ids.length} Selected Program{coupon.applicable_program_ids.length > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-emerald-400 text-[11px]">All Programs</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isExpired ? (
                          <Badge variant="outline" className="text-rose-400 border-rose-500/30 text-[10px]">
                            Expired
                          </Badge>
                        ) : coupon.is_active ? (
                          <Badge variant="teal" className="text-[10px]">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="neutral" className="text-[10px]">
                            Deactivated
                          </Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Active */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              toggleActiveMutation.mutate({
                                id: coupon.id,
                                newStatus: !coupon.is_active,
                              })
                            }
                            className="h-7 px-2 border-[#1A373E] bg-[#0E2024] text-[11px]"
                            title={coupon.is_active ? 'Deactivate Coupon' : 'Activate Coupon'}
                          >
                            {coupon.is_active ? (
                              <ToggleRight className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-[#8D9FA4]" />
                            )}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDuplicate(coupon)}
                            className="h-7 px-2 border-[#1A373E] bg-[#0E2024] text-[11px] text-[#8D9FA4] hover:text-white"
                            title="Duplicate Coupon"
                          >
                            Duplicate
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEdit(coupon)}
                            className="h-7 px-2 border-[#1A373E] bg-[#0E2024] text-[11px] text-amber-400 hover:text-white"
                          >
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          Create / Edit Coupon Modal
         ========================================================================= */}
      <Dialog open={editorModalOpen} onOpenChange={setEditorModalOpen}>
        <DialogContent className="max-w-lg bg-[#081619] border border-[#1A373E] text-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <Tag className="h-5 w-5 text-amber-500" />
              <span>{editingCoupon ? 'Edit Promotional Coupon' : 'Create Promotional Coupon'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[#8D9FA4]">
              Configure coupon code rules, discount thresholds, and program applicability.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            {formError && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                {formError}
              </div>
            )}

            {/* Code & Auto-generator */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#8D9FA4]">Coupon Code *</label>
                <button
                  type="button"
                  onClick={generateRandomCode}
                  className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Auto-generate Code</span>
                </button>
              </div>
              <input
                type="text"
                placeholder="e.g. MINDSET25"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-[#1A373E] bg-[#0E2024] px-3 py-2 text-xs font-mono font-bold text-amber-400 uppercase placeholder-[#8D9FA4] focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Type & Value */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#8D9FA4] mb-1">Discount Type *</label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="w-full rounded-lg border border-[#1A373E] bg-[#0E2024] px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                >
                  <option value="percent">Percentage Discount (%)</option>
                  <option value="flat">Flat Rupee Discount (₹)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8D9FA4] mb-1">
                  {discountType === 'percent' ? 'Discount Percentage (%) *' : 'Discount Amount (₹) *'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={discountType === 'percent' ? 100 : 100000}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#1A373E] bg-[#0E2024] px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            {/* Caps */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#8D9FA4] mb-1">
                  Max Redemptions (Total Cap)
                </label>
                <input
                  type="number"
                  placeholder="Unlimited if blank"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  className="w-full rounded-lg border border-[#1A373E] bg-[#0E2024] px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8D9FA4] mb-1">
                  Redemptions Per Student *
                </label>
                <input
                  type="number"
                  min={1}
                  value={perUserLimit}
                  onChange={(e) => setPerUserLimit(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#1A373E] bg-[#0E2024] px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            {/* Validity Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#8D9FA4] mb-1">
                  Valid From (IST) *
                </label>
                <input
                  type="datetime-local"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  className="w-full rounded-lg border border-[#1A373E] bg-[#0E2024] px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8D9FA4] mb-1">
                  Valid Until (IST - Optional)
                </label>
                <input
                  type="datetime-local"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full rounded-lg border border-[#1A373E] bg-[#0E2024] px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            {/* Applicable Programs Multi-select */}
            <div>
              <label className="block text-xs font-semibold text-[#8D9FA4] mb-1">
                Applicable Programs (Leave all unchecked to apply to ALL programs)
              </label>
              <div className="max-h-32 overflow-y-auto rounded-lg border border-[#1A373E] bg-[#0E2024] p-2 space-y-1">
                {programs.map((p) => {
                  const isChecked = applicablePrograms.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className="flex items-center gap-2 p-1 rounded hover:bg-[#081619] text-xs cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setApplicablePrograms((prev) =>
                            prev.includes(p.id)
                              ? prev.filter((id) => id !== p.id)
                              : [...prev, p.id]
                          );
                        }}
                        className="rounded border-[#1A373E] bg-[#081619] text-amber-500 focus:ring-amber-500"
                      />
                      <span className="text-white">{p.title}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Active Toggle */}
            <label className="flex items-center gap-2 cursor-pointer text-xs text-white pt-1">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-[#1A373E] bg-[#0E2024] text-amber-500 focus:ring-amber-500"
              />
              <span>Coupon is active and available for redemption</span>
            </label>
          </DialogBody>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditorModalOpen(false)}
              disabled={saveCouponMutation.isPending}
              className="border-[#1A373E] text-xs text-[#8D9FA4]"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => saveCouponMutation.mutate()}
              disabled={saveCouponMutation.isPending || !code.trim()}
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs"
            >
              {saveCouponMutation.isPending ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          Test this Coupon Simulator Modal
         ========================================================================= */}
      <Dialog open={simulatorModalOpen} onOpenChange={setSimulatorModalOpen}>
        <DialogContent className="max-w-md bg-[#081619] border border-[#1A373E] text-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <Play className="h-5 w-5 text-amber-500" />
              <span>Test This Coupon Simulator</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[#8D9FA4]">
              Simulate checkout pricing and verify coupon calculation rules against any program.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#8D9FA4] mb-1">
                Select Program to Test *
              </label>
              <select
                value={simProgramId}
                onChange={(e) => setSimProgramId(e.target.value)}
                className="w-full rounded-lg border border-[#1A373E] bg-[#0E2024] px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
              >
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({formatPaise(p.price_paise)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8D9FA4] mb-1">
                Enter Coupon Code *
              </label>
              <input
                type="text"
                placeholder="e.g. GROWTH20"
                value={simCode}
                onChange={(e) => setSimCode(e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-[#1A373E] bg-[#0E2024] px-3 py-2 text-xs font-mono font-bold text-amber-400 uppercase focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Simulation Results Display */}
            {simResult && (
              <div
                className={`rounded-xl border p-4 text-xs space-y-2 ${
                  simResult.valid
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                    : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  {simResult.valid ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-rose-400" />
                  )}
                  <span>{simResult.message}</span>
                </div>

                {simResult.valid && (
                  <div className="space-y-1.5 pt-2 border-t border-emerald-500/30 text-emerald-100">
                    <div className="flex justify-between">
                      <span className="text-[#8D9FA4]">Original Price:</span>
                      <span className="line-through">{formatPaise(simResult.original_price_paise)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Discount:</span>
                      <span className="text-amber-400">-{formatPaise(simResult.discount_paise)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-white text-sm pt-1 border-t border-emerald-500/20">
                      <span>Final Checkout Price:</span>
                      <span className="text-emerald-400">{formatPaise(simResult.final_price_paise)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogBody>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSimulatorModalOpen(false)}
              className="border-[#1A373E] text-xs text-[#8D9FA4]"
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={handleRunSimulator}
              disabled={simLoading || !simProgramId || !simCode.trim()}
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs"
            >
              {simLoading ? 'Testing...' : 'Test Code'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCouponsPage;
