import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import {
  useAuth,
  Button,
  ErrorDetailsAlert,
} from '@abrainoconscious/ui';
import {
  fetchProgramPublicDetail,
  formatPaise,
  formatDateIST,
  PILLARS,
  enrollInFreeProgram,
  registerPaymentInterest,
  type ProgramPublicDetail,
} from '@abrainoconscious/shared';
import {
  ShieldCheck,
  Calendar,
  Lock,
  CheckCircle2,
  Bell,
  Sparkles,
  Loader2,
  Mail,
  Phone,
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { supabase, user } = useAuth();

  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Payment Interest state (for paid programs while payments are on hold)
  const [interestEmail, setInterestEmail] = useState(user?.email || '');
  const [interestPhone, setInterestPhone] = useState('');
  const [interestSubmitted, setInterestSubmitted] = useState(false);

  // Fetch program detail
  const {
    data: program,
    isLoading,
    isError,
    error,
  } = useQuery<ProgramPublicDetail | null>({
    queryKey: ['checkout-program', slug],
    queryFn: () => (slug ? fetchProgramPublicDetail(supabase, slug) : Promise.resolve(null)),
    enabled: Boolean(slug),
  });

  // Free enrollment mutation
  const freeEnrollMutation = useMutation({
    mutationFn: async (programId: string) => {
      const res = await enrollInFreeProgram(supabase, programId);
      if (!res.ok) {
        throw new Error(res.error || 'Failed to complete free enrollment');
      }
      return res;
    },
    onSuccess: (data) => {
      navigate(`/my-programs?welcome=${data.slug || slug}`);
    },
  });

  // Interest registration mutation
  const interestMutation = useMutation({
    mutationFn: async () => {
      if (!program) return;
      if (!interestEmail.trim()) throw new Error('Please enter a valid email address');
      const res = await registerPaymentInterest(supabase, {
        program_id: program.id,
        email: interestEmail.trim(),
        phone: interestPhone.trim() || undefined,
      });
      if (!res.ok) {
        throw new Error(res.error || 'Failed to register interest');
      }
      return res;
    },
    onSuccess: () => {
      setInterestSubmitted(true);
    },
  });

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponMessage('Coupon code applied. In Step 7, dynamic discounts are calculated on Razorpay checkout.');
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-10 space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded bg-[#0E2024]" />
        <div className="h-64 rounded-2xl bg-[#0E2024]" />
      </div>
    );
  }

  if (isError || !program) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-4">
        <ErrorDetailsAlert
          title="Program not found"
          error={error}
        />
        <Button variant="primary" onClick={() => navigate('/explore')}>
          Return to Library &rarr;
        </Button>
      </div>
    );
  }

  // Already enrolled guard
  if (program.is_enrolled) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-white">You Are Already Enrolled!</h2>
        <p className="text-xs text-[#8D9FA4] max-w-sm mx-auto">
          You have active access to <strong>{program.title}</strong>. Your daily sessions and materials are ready
          in your dashboard.
        </p>
        <Button variant="cta" onClick={() => navigate(`/programs/${program.slug}`)}>
          Go to Program Dashboard &rarr;
        </Button>
      </div>
    );
  }

  const isFree = program.price_paise === 0;
  const pillarInfo = PILLARS[program.category];
  const isSoldOut = typeof program.seats_left === 'number' && program.seats_left === 0;

  if (isSoldOut) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <span className="text-4xl">⚠️</span>
        <h2 className="font-serif text-2xl font-bold text-white">Cohort Is Sold Out</h2>
        <p className="text-xs text-[#8D9FA4] max-w-sm mx-auto">
          All allocated seats for <strong>{program.title}</strong> have been claimed. Keep an eye on announcements
          for future cohort batches.
        </p>
        <Button variant="primary" onClick={() => navigate('/explore')}>
          Explore Other Programs &rarr;
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 space-y-8">
      <Helmet>
        <title>Order Summary | {program.title} | ABrainoConscious</title>
      </Helmet>

      {/* Breadcrumb & Heading */}
      <div>
        <button
          type="button"
          onClick={() => navigate(`/programs/${program.slug}`)}
          className="text-xs text-amber-400 hover:underline mb-2 inline-block"
        >
          &larr; Back to {program.title} Overview
        </button>
        <h1 className="font-serif text-3xl font-bold text-white">Enrollment Order Summary</h1>
        <p className="text-xs text-[#8D9FA4]">
          Review your cohort access and complete your registration.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left: Program Summary & Anti-Piracy Agreement */}
        <div className="md:col-span-7 space-y-6">
          <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: `${pillarInfo.accentColor}20`,
                  color: pillarInfo.accentColor,
                }}
              >
                {pillarInfo.title}
              </span>
              <span className="text-xs text-[#8D9FA4] uppercase tracking-wider">
                • {program.type === 'challenge' ? 'Live Cohort Challenge' : 'Masterclass Course'}
              </span>
            </div>

            <h2 className="font-serif text-2xl font-bold text-white leading-tight">
              {program.title}
            </h2>

            <p className="text-xs text-[#A0B1B5] leading-relaxed">
              {program.short_description}
            </p>

            <div className="space-y-2 pt-2 border-t border-[#1A373E] text-xs text-[#8D9FA4]">
              {program.starts_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-amber-400" />
                  <span>Starts: <strong className="text-white">{formatDateIST(program.starts_at)}</strong></span>
                </div>
              )}
              {program.type === 'challenge' && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Includes daily interactive live calls with Naman & actionable worksheets</span>
                </div>
              )}
            </div>
          </div>

          {/* Terms & Anti-Piracy Agreement */}
          <div className="rounded-2xl border border-[#1A373E] bg-[#0E2024] p-5 space-y-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms-check"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[#1A373E] bg-[#040C0E] text-amber-500 focus:ring-0"
              />
              <label htmlFor="terms-check" className="text-xs text-[#8D9FA4] leading-relaxed cursor-pointer select-none">
                I agree to the <strong className="text-white">Terms of Enrollment & Anti-Piracy Policy</strong>. All
                live sessions, worksheets, and course materials are for my personal educational use only. Screen
                recording, link sharing, or re-uploading content is strictly prohibited.
              </label>
            </div>
          </div>
        </div>

        {/* Right: Price Breakdown & Enrollment / Payment Interest CTA */}
        <div className="md:col-span-5 space-y-4">
          <div className="rounded-2xl border border-amber-500/30 bg-[#0E2024] p-6 text-white space-y-5 shadow-xl">
            <h3 className="font-serif text-base font-bold text-white">Payment Breakdown</h3>

            <div className="space-y-2.5 text-xs text-[#8D9FA4] border-b border-[#1A373E] pb-4">
              <div className="flex justify-between">
                <span>Tuition Fee</span>
                <span className="text-white font-medium">{formatPaise(program.price_paise)}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Discount</span>
                <span>₹0</span>
              </div>
              <div className="flex justify-between">
                <span>GST (Inclusive, 18%)</span>
                <span>Included</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline pt-1">
              <span className="text-xs font-semibold text-[#8D9FA4] uppercase">Total Payable</span>
              <span className="font-serif text-3xl font-bold text-white">
                {isFree ? 'FREE' : formatPaise(program.price_paise)}
              </span>
            </div>

            {/* If Program is FREE (0 paise) */}
            {isFree ? (
              <div className="space-y-3 pt-2">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Complimentary Community Cohort (No payment required).</span>
                </div>

                {freeEnrollMutation.isError && (
                  <ErrorDetailsAlert
                    title="Enrollment failed"
                    error={freeEnrollMutation.error}
                  />
                )}

                <Button
                  size="lg"
                  variant="cta"
                  disabled={!termsAccepted || freeEnrollMutation.isPending}
                  onClick={() => freeEnrollMutation.mutate(program.id)}
                  className="w-full font-bold text-xs shadow-lg"
                >
                  {freeEnrollMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ENROLLING FOR FREE...
                    </>
                  ) : (
                    'CONFIRM FREE ENROLLMENT &rarr;'
                  )}
                </Button>
              </div>
            ) : (
              /* If Program is PAID (Payments ON HOLD in Step 8) */
              <div className="space-y-4 pt-2">
                {/* Coupon field */}
                <form onSubmit={handleApplyCoupon} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="w-full rounded-lg border border-[#1A373E] bg-[#040C0E] px-3 py-1.5 text-xs text-white uppercase focus:border-amber-500 focus:outline-none"
                    />
                    <Button type="submit" size="sm" variant="secondary" className="text-xs px-3">
                      Apply
                    </Button>
                  </div>
                  {couponMessage && (
                    <p className="text-[11px] text-amber-400 leading-tight">{couponMessage}</p>
                  )}
                </form>

                {/* Friendly On-Hold Notice Box */}
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-300 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Lock className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>Admissions Opening Very Soon</span>
                  </div>
                  <p className="text-amber-200/90 leading-relaxed text-[11px]">
                    Direct Razorpay checkout will open shortly. Register your interest below to receive an instant
                    invite and priority access the moment admissions open.
                  </p>
                </div>

                {/* Disabled Pay Button */}
                <Button
                  size="lg"
                  variant="cta"
                  disabled={true}
                  className="w-full font-bold text-xs opacity-60 cursor-not-allowed"
                >
                  PAYMENTS OPEN VERY SOON
                </Button>

                {/* Priority Interest Registration */}
                {interestSubmitted ? (
                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-center space-y-1">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 mx-auto" />
                    <p className="text-xs font-bold text-white">You're on the priority waitlist!</p>
                    <p className="text-[11px] text-emerald-300">
                      We'll notify <strong>{interestEmail}</strong> as soon as payments open.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#1A373E] bg-[#081619] p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-amber-400" />
                      <span className="font-serif text-xs font-bold text-white">
                        Notify me when payments open
                      </span>
                    </div>

                    {interestMutation.isError && (
                      <ErrorDetailsAlert
                        title="Registration error"
                        error={interestMutation.error}
                      />
                    )}

                    <div className="space-y-2">
                      <div className="relative">
                        <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#556B71]" />
                        <input
                          type="email"
                          placeholder="Your email address"
                          value={interestEmail}
                          onChange={(e) => setInterestEmail(e.target.value)}
                          className="w-full rounded-lg border border-[#1A373E] bg-[#040C0E] pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#556B71] focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <div className="relative">
                        <Phone className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#556B71]" />
                        <input
                          type="tel"
                          placeholder="WhatsApp / Phone (optional)"
                          value={interestPhone}
                          onChange={(e) => setInterestPhone(e.target.value)}
                          className="w-full rounded-lg border border-[#1A373E] bg-[#040C0E] pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#556B71] focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={interestMutation.isPending || !interestEmail}
                        onClick={() => interestMutation.mutate()}
                        className="w-full text-xs font-semibold py-2"
                      >
                        {interestMutation.isPending ? 'Saving...' : 'Notify Me When Admissions Open'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#8D9FA4] pt-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>7-Day 100% Money-Back Guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
