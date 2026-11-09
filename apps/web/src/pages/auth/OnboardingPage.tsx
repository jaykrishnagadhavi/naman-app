import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, Button } from '@abrainoconscious/ui';
import {
  OnboardingSchema,
  sanitizeProgramSlug,
  type GrowthPillar,
  PILLARS
} from '@abrainoconscious/shared';
import {
  Sparkles,
  HeartHandshake,
  Brain,
  GraduationCap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, supabase, refreshProfile } = useAuth();

  const programParam = sanitizeProgramSlug(searchParams.get('program'));

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [selectedPillars, setSelectedPillars] = useState<GrowthPillar[]>([]);
  const [referralSource, setReferralSource] = useState<'youtube' | 'instagram' | 'friend' | 'other'>('youtube');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      if (profile.full_name) {
        setFullName(profile.full_name);
      } else if (user?.user_metadata?.full_name) {
        setFullName(user.user_metadata.full_name);
      }
      if (profile.phone) {
        setPhone(profile.phone);
      }
    }
  }, [profile, user]);

  const togglePillar = (pillar: GrowthPillar) => {
    if (selectedPillars.includes(pillar)) {
      setSelectedPillars(selectedPillars.filter((p) => p !== pillar));
    } else {
      setSelectedPillars([...selectedPillars, pillar]);
    }
  };

  const getPillarIcon = (pillar: GrowthPillar) => {
    switch (pillar) {
      case 'emotional':
        return <HeartHandshake className="h-5 w-5" />;
      case 'mental':
        return <Brain className="h-5 w-5" />;
      case 'academic':
        return <GraduationCap className="h-5 w-5" />;
      case 'personal':
        return <Sparkles className="h-5 w-5" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validation = OnboardingSchema.safeParse({
      fullName,
      phone: phone.trim(),
      goalPillars: selectedPillars,
      referralSource,
    });

    if (!validation.success) {
      setErrorMessage(validation.error.issues[0]?.message || 'Please verify your information.');
      return;
    }

    if (!user) {
      setErrorMessage('You must be signed in to complete onboarding.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          goal_pillars: selectedPillars,
          referral_source: referralSource,
          onboarding_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        setErrorMessage(updateError.message);
        setLoading(false);
        return;
      }

      await refreshProfile();

      // If program intent was preserved, land directly on that program's page
      if (programParam) {
        navigate(`/programs/${programParam}`, { replace: true });
        return;
      }

      navigate('/my-programs', { replace: true });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save onboarding details.');
      setLoading(false);
    }
  };

  const pillarKeys: GrowthPillar[] = ['emotional', 'mental', 'academic', 'personal'];

  return (
    <div className="min-h-screen bg-[#040C0E] text-[#E1E8EA] flex flex-col justify-center px-4 sm:px-6 py-12">
      <div className="max-w-2xl mx-auto w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Welcome to ABrainoConscious</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Personalize Your Growth Journey
          </h1>
          <p className="text-xs sm:text-sm text-[#8D9FA4] max-w-lg mx-auto leading-relaxed">
            Take one calm minute to set up your student profile. We use your details to tailor your daily
            tasks and send live session reminders.
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="rounded-2xl border border-[#1A373E] bg-[#081619] p-6 sm:p-8 space-y-6 shadow-xl">
          {/* 1. Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-white">Confirm Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Priya Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3.5 py-2.5 text-xs text-white placeholder-[#556B71] focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-white">
                Phone Number <span className="text-[#8D9FA4] font-normal">(for SMS / WhatsApp live link alerts)</span>
              </label>
              <input
                type="tel"
                required
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3.5 py-2.5 text-xs text-white placeholder-[#556B71] focus:border-amber-500 focus:outline-none"
              />
              <p className="text-[10px] text-[#556B71]">Required for Razorpay payment receipt & session reminders</p>
            </div>
          </div>

          {/* 2. Growth Pillars Multi-Select */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-white">
                Which growth pillars would you like to focus on right now?
              </label>
              <p className="text-[11px] text-[#8D9FA4]">Select all that align with what you're working through.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pillarKeys.map((key) => {
                const info = PILLARS[key];
                const isSelected = selectedPillars.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => togglePillar(key)}
                    className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-amber-500/50 bg-amber-500/10 text-white'
                        : 'border-[#1A373E] bg-[#040C0E] text-[#8D9FA4] hover:border-[#2D5A64]'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
                        isSelected ? 'bg-amber-500 text-black font-bold' : 'bg-[#0E2024] text-[#8D9FA4]'
                      }`}
                    >
                      {getPillarIcon(key)}
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${isSelected ? 'text-amber-400' : 'text-white'}`}>
                          {info.title}
                        </span>
                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />}
                      </div>
                      <p className="text-[11px] text-[#8D9FA4] line-clamp-2">{info.tagline}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Referral Source */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-semibold text-white">How did you discover ABrainoConscious?</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'youtube', label: 'YouTube' },
                { id: 'instagram', label: 'Instagram' },
                { id: 'friend', label: 'Friend / Word of Mouth' },
                { id: 'other', label: 'Other' },
              ].map((src) => (
                <button
                  key={src.id}
                  type="button"
                  onClick={() => setReferralSource(src.id as 'youtube' | 'instagram' | 'friend' | 'other')}
                  className={`rounded-xl border px-3 py-2 text-xs font-medium text-center transition-all ${
                    referralSource === src.id
                      ? 'border-amber-500/40 bg-amber-500/20 text-white font-semibold'
                      : 'border-[#1A373E] bg-[#040C0E] text-[#8D9FA4] hover:bg-[#0E2024]'
                  }`}
                >
                  {src.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <Button type="submit" variant="primary" disabled={loading} className="w-full font-bold">
              {loading ? 'Saving Your Preferences...' : 'Complete Setup & Enter Student Portal'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

