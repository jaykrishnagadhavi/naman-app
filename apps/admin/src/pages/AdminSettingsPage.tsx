import React, { useState, useEffect, useCallback } from 'react';
import {
  useAuth,
  Badge,
  Button,
} from '@abrainoconscious/ui';
import {
  fetchSiteSettings,
  updateSiteSettings,
  SiteSettingsFormSchema,
  SiteSettingsFormValues,
  HelplineEntry,
} from '@abrainoconscious/shared';
import {
  Building2,
  FileText,
  HeartHandshake,
  Video,
  Shield,
  Palette,
  Globe,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  LogOut,
  ExternalLink,
} from 'lucide-react';

type TabKey = 'brand' | 'business' | 'legal' | 'support' | 'sessions' | 'site' | 'security';

export const AdminSettingsPage: React.FC = () => {
  const { supabase, profile, signOut } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [activeTab, setActiveTab] = useState<TabKey>('brand');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [form, setForm] = useState<SiteSettingsFormValues>({
    brand_name: 'ABrainoConscious',
    logo_url: '',
    favicon_url: '',
    support_email: 'support@abrainoconscious.com',
    support_whatsapp: '+919876543210',
    social_links: {
      youtube: 'https://youtube.com/@abrainoconscious',
      instagram: 'https://instagram.com/abrainoconscious',
      twitter: 'https://x.com/abrainoconscious',
      linkedin: 'https://linkedin.com/company/abrainoconscious',
    },
    channel_subscriber_count: 12500,

    gst_enabled: false,
    gst_number: '',
    gst_rate_percent: 18,
    invoice_details: {
      company_name: 'ABrainoConscious Media Pvt Ltd',
      address: '108 Mindful Way, Koramangala',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560034',
      pan: 'ABCDE1234F',
    },
    currency_display: 'INR',

    terms_html: `<h2>Terms of Service</h2><p>Welcome to ABrainoConscious. By accessing or enrolling in any program, challenge, or digital course on this platform, you agree to comply with and be bound by the following terms.</p><h3>1. Intellectual Property & Anti-Piracy</h3><p>All video sessions, daily challenge frameworks, and guided practices are proprietary to ABrainoConscious. Any redistribution, unauthorized recording, screen capture, or commercial broadcasting will lead to immediate account termination and legal action under the Indian Copyright Act, 1957.</p><h3>2. Conduct & Cohort Etiquette</h3><p>Participants are expected to treat peers and facilitators with dignity. Harassment, spamming, or disruptive behavior during live sessions will result in permanent removal without refund.</p>`,
    privacy_html: `<h2>Privacy Policy</h2><p>At ABrainoConscious, protecting your personal wellness journey and personal identity is paramount. This policy outlines how we collect, store, and process your data.</p><h3>1. Information We Collect</h3><p>We collect your name, email address, WhatsApp number for session reminders, and progress logs. We do not sell your personal data to any third-party advertisers or brokers.</p><h3>2. Right to Erasure</h3><p>Under our student privacy charter, you have the right to request full account and data deletion at any time via your account settings.</p>`,
    refund_policy_html: `<h2>Refund & Cancellation Policy</h2><p>All live cohorts and daily challenges are high-commitment transformational experiences with limited batch sizes.</p><h3>1. Cohort Programs</h3><p>Refund requests submitted at least 48 hours prior to Day 1 of the cohort are eligible for a 100% refund (minus payment processing fees). Once the cohort commences, no refunds will be issued.</p><h3>2. Technical Difficulties</h3><p>If you experience verified platform disruptions preventing live participation, our team will provide alternate recording access or cohort rollover options.</p>`,
    medical_disclaimer_html: `<div class="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200"><strong>Important Medical & Health Notice:</strong> All programs, challenges, mental clarity protocols, and audio/video resources provided by ABrainoConscious are strictly educational and for personal wellness enhancement. They are not intended as medical therapy, psychiatric treatment, clinical diagnosis, or a substitute for professional mental healthcare. If you are experiencing acute psychological distress, please consult a licensed psychiatrist or call a verified mental health helpline immediately.</div>`,

    support_helplines: [
      {
        name: 'Tele-MANAS (Govt of India)',
        number: '14416',
        hours: '24/7',
        region: 'India (National Toll-Free)',
        verified: true,
      },
      {
        name: 'KIRAN National Helpline',
        number: '1800-599-0019',
        hours: '24/7',
        region: 'India (13 Languages)',
        verified: true,
      },
      {
        name: 'Vandrevala Foundation',
        number: '+91 9999 666 555',
        hours: '24/7',
        region: 'Pan-India',
        verified: true,
      },
    ],

    allowed_live_link_hosts: ['zoom.us', 'meet.google.com', 'youtube.com', 'youtu.be'],
    live_link_join_window_before_minutes: 15,
    live_link_join_window_after_minutes: 120,
    default_daily_session_time: '06:30',

    maintenance_mode: false,
    idle_timeout_minutes: 30,
  });

  const [rawHosts, setRawHosts] = useState('zoom.us, meet.google.com, youtube.com, youtu.be');

  // Load settings on mount
  const loadSettings = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const data = await fetchSiteSettings(supabase);
      if (data) {
        setForm({
          brand_name: data.brand_name || 'ABrainoConscious',
          logo_url: data.logo_url || '',
          favicon_url: data.favicon_url || '',
          support_email: data.support_email || 'support@abrainoconscious.com',
          support_whatsapp: data.support_whatsapp || '',
          social_links: data.social_links || { youtube: '', instagram: '', twitter: '', linkedin: '' },
          channel_subscriber_count: data.channel_subscriber_count || 0,

          gst_enabled: !!data.gst_enabled,
          gst_number: data.gst_number || '',
          gst_rate_percent: Number(data.gst_rate_percent) || 18,
          invoice_details: data.invoice_details || {
            company_name: 'ABrainoConscious',
            address: '',
            city: '',
            state: '',
            pincode: '',
            pan: '',
          },
          currency_display: data.currency_display || 'INR',

          terms_html: data.terms_html || '',
          privacy_html: data.privacy_html || '',
          refund_policy_html: data.refund_policy_html || '',
          medical_disclaimer_html: data.medical_disclaimer_html || '',

          support_helplines: Array.isArray(data.support_helplines) ? data.support_helplines : [],

          allowed_live_link_hosts: Array.isArray(data.allowed_live_link_hosts)
            ? data.allowed_live_link_hosts
            : ['zoom.us', 'meet.google.com'],
          live_link_join_window_before_minutes: data.live_link_join_window_before_minutes ?? 15,
          live_link_join_window_after_minutes: data.live_link_join_window_after_minutes ?? 120,
          default_daily_session_time: data.default_daily_session_time || '06:30',

          maintenance_mode: !!data.maintenance_mode,
          idle_timeout_minutes: data.idle_timeout_minutes || 30,
        });

        if (Array.isArray(data.allowed_live_link_hosts)) {
          setRawHosts(data.allowed_live_link_hosts.join(', '));
        }
      }
    } catch (err: unknown) {
      console.error('Error fetching site settings:', err);
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to load site settings.',
      });
    } finally {
      setLoading(false);
    }
  }, [supabase, isAdmin]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Handle Save
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setToast(null);

    try {
      // Parse hosts list
      const hostsArray = rawHosts
        .split(',')
        .map((h) => h.trim())
        .filter((h) => h.length > 0);

      const payload: SiteSettingsFormValues = {
        ...form,
        allowed_live_link_hosts: hostsArray,
      };

      // Zod Validation
      const validated = SiteSettingsFormSchema.parse(payload);

      await updateSiteSettings(supabase, validated);

      setToast({
        type: 'success',
        message: 'Platform settings updated successfully. Student app and session guards are refreshed.',
      });
    } catch (err: unknown) {
      console.error('Error saving site settings:', err);
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save settings. Please check your inputs.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Helpline helpers
  const handleAddHelpline = () => {
    const newHelpline: HelplineEntry = {
      name: 'New Support Service',
      number: '1800-000-0000',
      hours: '24/7',
      region: 'India',
      verified: true,
    };
    setForm((prev) => ({
      ...prev,
      support_helplines: [...prev.support_helplines, newHelpline],
    }));
  };

  const handleUpdateHelpline = (index: number, field: keyof HelplineEntry, val: unknown) => {
    setForm((prev) => {
      const copy = [...prev.support_helplines];
      copy[index] = { ...copy[index], [field]: val };
      return { ...prev, support_helplines: copy };
    });
  };

  const handleRemoveHelpline = (index: number) => {
    setForm((prev) => ({
      ...prev,
      support_helplines: prev.support_helplines.filter((_, i) => i !== index),
    }));
  };

  const handleSignOutEverywhere = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to sign out of all active sessions across all devices?'
    );
    if (!confirmed) return;
    try {
      await supabase.auth.signOut({ scope: 'global' });
      signOut();
    } catch (err) {
      console.error('Error signing out everywhere:', err);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 mb-3">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="font-serif text-xl font-bold text-white">Access Restricted</h2>
        <p className="mt-1 max-w-sm text-xs text-[#8D9FA4]">
          Platform configuration, brand identity, and legal policies are restricted to Super Administrators.
        </p>
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'brand', label: 'Brand & Identity', icon: Palette },
    { key: 'business', label: 'Business & Invoicing', icon: Building2 },
    { key: 'legal', label: 'Legal Pages', icon: FileText },
    { key: 'support', label: 'Crisis & Helplines', icon: HeartHandshake },
    { key: 'sessions', label: 'Live Sessions', icon: Video },
    { key: 'site', label: 'Site & Maintenance', icon: Globe },
    { key: 'security', label: 'Security & Auth', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold text-white">Platform Settings</h1>
            <Badge variant="amber">System Config</Badge>
            {form.maintenance_mode && (
              <span className="rounded-md border border-rose-500/30 bg-rose-500/20 px-2 py-0.5 text-xs text-rose-300 font-semibold">
                Maintenance Mode Active
              </span>
            )}
          </div>
          <p className="text-xs text-[#8D9FA4]">
            Manage brand profile, business details, legal disclosures, crisis helplines, and runtime guards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadSettings}
            disabled={loading || saving}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Reload
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleSave()}
            disabled={loading || saving}
            className="flex items-center gap-1.5"
          >
            <Save className="h-3.5 w-3.5" /> {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div
          className={`flex items-center gap-2 rounded-xl p-3.5 text-xs border ${
            toast.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
          )}
          <span className="flex-1">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-xs underline hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-[#1A373E] pb-1 gap-1 text-xs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 whitespace-nowrap font-medium transition-colors ${
                isActive
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'text-[#8D9FA4] hover:bg-[#081619] hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Form Content */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-28 w-full animate-pulse rounded-2xl border border-[#1A373E] bg-[#081619]"
            />
          ))}
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* TAB 1: BRAND */}
          {activeTab === 'brand' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-5 space-y-4">
                <h3 className="font-serif text-sm font-bold text-white flex items-center gap-2">
                  <Palette className="h-4 w-4 text-amber-400" /> Brand Identity
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[#8D9FA4] font-medium mb-1">Brand Name *</label>
                    <input
                      type="text"
                      value={form.brand_name}
                      onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
                      required
                      className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-white placeholder-[#8D9FA4]/50 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8D9FA4] font-medium mb-1">
                      YouTube Subscriber Count
                    </label>
                    <input
                      type="number"
                      value={form.channel_subscriber_count}
                      onChange={(e) =>
                        setForm({ ...form, channel_subscriber_count: parseInt(e.target.value, 10) || 0 })
                      }
                      className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8D9FA4] font-medium mb-1">Logo URL</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={form.logo_url || ''}
                      onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                      className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8D9FA4] font-medium mb-1">Favicon URL</label>
                    <input
                      type="url"
                      placeholder="https://.../favicon.ico"
                      value={form.favicon_url || ''}
                      onChange={(e) => setForm({ ...form, favicon_url: e.target.value })}
                      className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-5 space-y-4">
                <h3 className="font-serif text-sm font-bold text-white flex items-center gap-2">
                  <HeartHandshake className="h-4 w-4 text-amber-400" /> Support Contact & Social
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[#8D9FA4] font-medium mb-1">Support Email *</label>
                    <input
                      type="email"
                      value={form.support_email}
                      onChange={(e) => setForm({ ...form, support_email: e.target.value })}
                      required
                      className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8D9FA4] font-medium mb-1">
                      Support WhatsApp Number (with country code)
                    </label>
                    <input
                      type="text"
                      value={form.support_whatsapp || ''}
                      placeholder="+91..."
                      onChange={(e) => setForm({ ...form, support_whatsapp: e.target.value })}
                      className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8D9FA4] font-medium mb-1">YouTube Channel URL</label>
                    <input
                      type="url"
                      value={form.social_links.youtube}
                      placeholder="https://youtube.com/@..."
                      onChange={(e) =>
                        setForm({
                          ...form,
                          social_links: { ...form.social_links, youtube: e.target.value },
                        })
                      }
                      className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8D9FA4] font-medium mb-1">Instagram Profile URL</label>
                    <input
                      type="url"
                      value={form.social_links.instagram}
                      placeholder="https://instagram.com/..."
                      onChange={(e) =>
                        setForm({
                          ...form,
                          social_links: { ...form.social_links, instagram: e.target.value },
                        })
                      }
                      className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8D9FA4] font-medium mb-1">Twitter / X URL</label>
                    <input
                      type="url"
                      value={form.social_links.twitter}
                      placeholder="https://x.com/..."
                      onChange={(e) =>
                        setForm({
                          ...form,
                          social_links: { ...form.social_links, twitter: e.target.value },
                        })
                      }
                      className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8D9FA4] font-medium mb-1">LinkedIn Page URL</label>
                    <input
                      type="url"
                      value={form.social_links.linkedin}
                      placeholder="https://linkedin.com/company/..."
                      onChange={(e) =>
                        setForm({
                          ...form,
                          social_links: { ...form.social_links, linkedin: e.target.value },
                        })
                      }
                      className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BUSINESS & INVOICING */}
          {activeTab === 'business' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-sm font-bold text-white flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-amber-400" /> GST Configuration
                    </h3>
                    <p className="text-xs text-[#8D9FA4]">
                      Configure Goods and Services Tax computation for enrolled student receipts.
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={form.gst_enabled}
                      onChange={(e) => setForm({ ...form, gst_enabled: e.target.checked })}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-[#1A373E] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-amber-500 peer-checked:after:translate-x-full" />
                  </label>
                </div>

                {form.gst_enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2 border-t border-[#1A373E]">
                    <div>
                      <label className="block text-[#8D9FA4] font-medium mb-1">GSTIN Number</label>
                      <input
                        type="text"
                        placeholder="22AAAAA0000A1Z5"
                        value={form.gst_number || ''}
                        onChange={(e) => setForm({ ...form, gst_number: e.target.value })}
                        className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-white focus:border-amber-500 focus:outline-none uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[#8D9FA4] font-medium mb-1">GST Rate (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={form.gst_rate_percent}
                        onChange={(e) =>
                          setForm({ ...form, gst_rate_percent: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-5 space-y-4">
                <h3 className="font-serif text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-400" /> Invoice Billing Entity
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[#8D9FA4] font-medium mb-1">Company / Legal Name</label>
                    <input
                      type="text"
                      value={form.invoice_details.company_name}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          invoice_details: { ...form.invoice_details, company_name: e.target.value },
                        })
                      }
                      className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8D9FA4] font-medium mb-1">PAN Number</label>
                    <input
                      type="text"
                      value={form.invoice_details.pan}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          invoice_details: { ...form.invoice_details, pan: e.target.value },
                        })
                      }
                      className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-white focus:border-amber-500 focus:outline-none uppercase"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[#8D9FA4] font-medium mb-1">Registered Address</label>
                    <input
                      type="text"
                      value={form.invoice_details.address}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          invoice_details: { ...form.invoice_details, address: e.target.value },
                        })
                      }
                      className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8D9FA4] font-medium mb-1">City</label>
                    <input
                      type="text"
                      value={form.invoice_details.city}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          invoice_details: { ...form.invoice_details, city: e.target.value },
                        })
                      }
                      className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8D9FA4] font-medium mb-1">State & PIN</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="State"
                        value={form.invoice_details.state}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            invoice_details: { ...form.invoice_details, state: e.target.value },
                          })
                        }
                        className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Pincode"
                        value={form.invoice_details.pincode}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            invoice_details: { ...form.invoice_details, pincode: e.target.value },
                          })
                        }
                        className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LEGAL PAGES */}
          {activeTab === 'legal' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-sm font-bold text-white flex items-center gap-2">
                      <FileText className="h-4 w-4 text-amber-400" /> Terms of Service
                    </h3>
                    <p className="text-xs text-[#8D9FA4]">
                      Public terms rendered on student route <code>/terms</code>.
                    </p>
                  </div>
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-amber-400 hover:underline"
                  >
                    Preview Page <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <textarea
                  rows={8}
                  value={form.terms_html}
                  onChange={(e) => setForm({ ...form, terms_html: e.target.value })}
                  className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] p-3 text-xs font-mono text-[#E1E8EA] focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-sm font-bold text-white flex items-center gap-2">
                      <FileText className="h-4 w-4 text-amber-400" /> Privacy Policy
                    </h3>
                    <p className="text-xs text-[#8D9FA4]">
                      Student data protection & GDPR/DPDP disclosures on <code>/privacy</code>.
                    </p>
                  </div>
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-amber-400 hover:underline"
                  >
                    Preview Page <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <textarea
                  rows={8}
                  value={form.privacy_html}
                  onChange={(e) => setForm({ ...form, privacy_html: e.target.value })}
                  className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] p-3 text-xs font-mono text-[#E1E8EA] focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-sm font-bold text-white flex items-center gap-2">
                      <FileText className="h-4 w-4 text-amber-400" /> Refund & Cancellation Policy
                    </h3>
                    <p className="text-xs text-[#8D9FA4]">
                      Cohort withdrawal terms rendered on student route <code>/refund-policy</code>.
                    </p>
                  </div>
                  <a
                    href="/refund-policy"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-amber-400 hover:underline"
                  >
                    Preview Page <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <textarea
                  rows={6}
                  value={form.refund_policy_html}
                  onChange={(e) => setForm({ ...form, refund_policy_html: e.target.value })}
                  className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] p-3 text-xs font-mono text-[#E1E8EA] focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-5 space-y-4">
                <div>
                  <h3 className="font-serif text-sm font-bold text-amber-300 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" /> Medical & Wellness Disclaimer
                  </h3>
                  <p className="text-xs text-[#8D9FA4]">
                    Prominent disclaimer banner rendered on all live sessions and cohort checkouts.
                  </p>
                </div>
                <textarea
                  rows={4}
                  value={form.medical_disclaimer_html}
                  onChange={(e) => setForm({ ...form, medical_disclaimer_html: e.target.value })}
                  className="w-full rounded-xl border border-amber-500/30 bg-[#040C0E] p-3 text-xs text-amber-200 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 4: CRISIS & SUPPORT HELPLINES */}
          {activeTab === 'support' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-5 space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-serif text-sm font-bold text-white flex items-center gap-2">
                      <HeartHandshake className="h-4 w-4 text-rose-400" /> Crisis & Psychological
                      Helplines
                    </h3>
                    <p className="text-xs text-[#8D9FA4]">
                      Emergency contact resources rendered on student <code>/support</code> and live session
                      drawers.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddHelpline}
                    className="flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Helpline Row
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#1A373E] text-[#8D9FA4]">
                        <th className="pb-2 font-medium">Service / Organisation</th>
                        <th className="pb-2 font-medium">Phone / Shortcode</th>
                        <th className="pb-2 font-medium">Operating Hours</th>
                        <th className="pb-2 font-medium">Region / Coverage</th>
                        <th className="pb-2 font-medium text-center">Verified</th>
                        <th className="pb-2 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A373E]/60">
                      {form.support_helplines.map((line, idx) => (
                        <tr key={idx} className="hover:bg-[#0E2024]/40">
                          <td className="py-2.5 pr-2">
                            <input
                              type="text"
                              value={line.name}
                              onChange={(e) => handleUpdateHelpline(idx, 'name', e.target.value)}
                              className="w-full rounded-lg border border-[#1A373E] bg-[#040C0E] px-2 py-1 text-white focus:border-amber-500 focus:outline-none"
                            />
                          </td>
                          <td className="py-2.5 pr-2">
                            <input
                              type="text"
                              value={line.number}
                              onChange={(e) => handleUpdateHelpline(idx, 'number', e.target.value)}
                              className="w-full rounded-lg border border-[#1A373E] bg-[#040C0E] px-2 py-1 font-mono text-amber-300 focus:border-amber-500 focus:outline-none"
                            />
                          </td>
                          <td className="py-2.5 pr-2">
                            <input
                              type="text"
                              value={line.hours}
                              onChange={(e) => handleUpdateHelpline(idx, 'hours', e.target.value)}
                              className="w-full rounded-lg border border-[#1A373E] bg-[#040C0E] px-2 py-1 text-[#E1E8EA] focus:border-amber-500 focus:outline-none"
                            />
                          </td>
                          <td className="py-2.5 pr-2">
                            <input
                              type="text"
                              value={line.region}
                              onChange={(e) => handleUpdateHelpline(idx, 'region', e.target.value)}
                              className="w-full rounded-lg border border-[#1A373E] bg-[#040C0E] px-2 py-1 text-[#E1E8EA] focus:border-amber-500 focus:outline-none"
                            />
                          </td>
                          <td className="py-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={line.verified}
                              onChange={(e) => handleUpdateHelpline(idx, 'verified', e.target.checked)}
                              className="rounded border-[#1A373E] text-amber-500 focus:ring-0"
                            />
                          </td>
                          <td className="py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveHelpline(idx)}
                              className="rounded p-1 text-rose-400 hover:bg-rose-500/20"
                              title="Delete Helpline"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LIVE SESSIONS */}
          {activeTab === 'sessions' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-5 space-y-4">
                <h3 className="font-serif text-sm font-bold text-white flex items-center gap-2">
                  <Video className="h-4 w-4 text-amber-400" /> Live Link & Attendance Constraints
                </h3>
                <p className="text-xs text-[#8D9FA4]">
                  Security rules preventing off-platform link injections and governing student unlock windows.
                </p>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[#8D9FA4] font-medium mb-1">
                      Allowed Live-Link Host Domains (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={rawHosts}
                      onChange={(e) => setRawHosts(e.target.value)}
                      placeholder="zoom.us, meet.google.com, youtube.com"
                      className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-white font-mono focus:border-amber-500 focus:outline-none"
                    />
                    <span className="mt-1 block text-[11px] text-[#8D9FA4]/70">
                      When publishing session links, URLs outside these domains will be rejected by the backend RPC.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="block text-[#8D9FA4] font-medium mb-1">
                        Unlock Window Before Session
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="180"
                          value={form.live_link_join_window_before_minutes}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              live_link_join_window_before_minutes: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                        />
                        <span className="text-[#8D9FA4] text-xs">mins</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#8D9FA4] font-medium mb-1">
                        Unlock Window After Session
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="15"
                          max="720"
                          value={form.live_link_join_window_after_minutes}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              live_link_join_window_after_minutes: parseInt(e.target.value, 10) || 120,
                            })
                          }
                          className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                        />
                        <span className="text-[#8D9FA4] text-xs">mins</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#8D9FA4] font-medium mb-1">
                        Default Daily Session Time (IST)
                      </label>
                      <input
                        type="time"
                        value={form.default_daily_session_time}
                        onChange={(e) => setForm({ ...form, default_daily_session_time: e.target.value })}
                        className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SITE & MAINTENANCE */}
          {activeTab === 'site' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-sm font-bold text-white flex items-center gap-2">
                      <Globe className="h-4 w-4 text-amber-400" /> Platform Maintenance Mode
                    </h3>
                    <p className="text-xs text-[#8D9FA4]">
                      When activated, the student app shows an Under Scheduled Maintenance screen while
                      administrators retain full dashboard access.
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={form.maintenance_mode}
                      onChange={(e) => setForm({ ...form, maintenance_mode: e.target.checked })}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-[#1A373E] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-rose-500 peer-checked:after:translate-x-full" />
                  </label>
                </div>

                {form.maintenance_mode && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300">
                    <strong>Notice:</strong> Maintenance mode is currently active. Public visitors and enrolled
                    students will be greeted with a scheduled maintenance notice.
                  </div>
                )}
              </div>

              {/* Payments Gateway Status */}
              <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-5 space-y-3">
                <h3 className="font-serif text-sm font-bold text-white flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#8D9FA4]" /> Payment Gateway Gateway Mode
                </h3>
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-xs font-mono text-amber-300">
                    Not configured (Payments coming soon)
                  </span>
                  <span className="text-xs text-[#8D9FA4]">
                    Razorpay integration is on hold per Step 9 scope. Real-time billing endpoints remain disabled.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SECURITY & AUTH */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-5 space-y-4">
                <h3 className="font-serif text-sm font-bold text-white flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-400" /> Admin Session & Idle Timeout
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[#8D9FA4] font-medium mb-1">
                      Idle Inactivity Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="120"
                      value={form.idle_timeout_minutes}
                      onChange={(e) =>
                        setForm({ ...form, idle_timeout_minutes: parseInt(e.target.value, 10) || 30 })
                      }
                      className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                    />
                    <span className="mt-1 block text-[11px] text-[#8D9FA4]/70">
                      Admins will see a 2-minute countdown warning before being automatically signed out.
                    </span>
                  </div>
                  <div>
                    <label className="block text-[#8D9FA4] font-medium mb-1">Multi-Factor Authentication</label>
                    <div className="p-3 rounded-xl border border-[#1A373E] bg-[#040C0E] text-xs text-[#8D9FA4]">
                      TOTP 2-Step Verification is strongly recommended for all super administrators. Check your
                      Supabase Auth dashboard to enforce MFA globally.
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-rose-500/30 bg-rose-950/10 p-5 space-y-4">
                <h3 className="font-serif text-sm font-bold text-rose-300 flex items-center gap-2">
                  <LogOut className="h-4 w-4 text-rose-400" /> Session Invalidation
                </h3>
                <p className="text-xs text-[#8D9FA4]">
                  Revoke all active JWT tokens and sessions across all web browsers and devices immediately.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSignOutEverywhere}
                  className="border-rose-500/40 text-rose-300 hover:bg-rose-500/20"
                >
                  Sign Out Everywhere
                </Button>
              </div>
            </div>
          )}

          {/* Sticky or Bottom Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1A373E]">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={loadSettings}
              disabled={loading || saving}
            >
              Reset to Saved
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading || saving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save All Settings'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
