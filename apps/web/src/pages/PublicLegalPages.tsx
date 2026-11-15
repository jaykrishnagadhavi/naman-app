import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth, Badge } from '@abrainoconscious/ui';
import { fetchSiteSettings } from '@abrainoconscious/shared';
import {
  FileText,
  Shield,
  RotateCcw,
  PhoneCall,
  AlertTriangle,
  Clock,
  MapPin,
} from 'lucide-react';

interface PublicSettingsData {
  brand_name: string;
  support_email: string;
  support_whatsapp?: string | null;
  terms_html: string;
  privacy_html: string;
  refund_policy_html: string;
  medical_disclaimer_html: string;
  legal_last_updated?: string;
  support_helplines?: Array<{
    name: string;
    number: string;
    hours: string;
    region: string;
    verified: boolean;
  }>;
}

export function usePublicSiteSettings() {
  const { supabase } = useAuth();
  return useQuery<PublicSettingsData>({
    queryKey: ['public-site-settings'],
    queryFn: async () => {
      // Try public RPC first, fallback to table query
      try {
        const { data, error } = await (supabase.rpc as any)('get_public_site_settings');
        if (!error && data) return data as PublicSettingsData;
      } catch {
        // Fallback to fetchSiteSettings
      }
      const data = await fetchSiteSettings(supabase);
      return data as PublicSettingsData;
    },
    staleTime: 1000 * 60 * 5,
  });
}

// 1. Terms of Service Page (/terms)
export const TermsPage: React.FC = () => {
  const { data, isLoading } = usePublicSiteSettings();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-[#1A373E] pb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-amber-500" />
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Terms of Service
          </h1>
        </div>
        <p className="text-xs text-[#8D9FA4] mt-1">
          {data?.brand_name || 'ABrainoConscious'} • Student Learning & Conduct Agreement
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-6 w-1/3 bg-[#081619] rounded animate-pulse" />
          <div className="h-32 bg-[#081619] rounded-xl animate-pulse" />
          <div className="h-32 bg-[#081619] rounded-xl animate-pulse" />
        </div>
      ) : (
        <div className="space-y-6">
          <div
            className="rounded-2xl border border-[#1A373E] bg-[#081619] p-6 sm:p-8 text-xs text-[#E1E8EA] leading-relaxed space-y-4 font-sans [&>h2]:font-serif [&>h2]:text-base [&>h2]:font-bold [&>h2]:text-white [&>h3]:font-serif [&>h3]:text-sm [&>h3]:font-bold [&>h3]:text-amber-400 [&>p]:text-[#8D9FA4] [&>ul]:list-disc [&>ul]:pl-5"
            dangerouslySetInnerHTML={{
              __html:
                data?.terms_html ||
                '<p>All programs and cohorts offered by ABrainoConscious are educational. Redistribution of video links or proprietary materials is strictly prohibited.</p>',
            }}
          />

          {data?.medical_disclaimer_html && (
            <div
              className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200"
              dangerouslySetInnerHTML={{ __html: data.medical_disclaimer_html }}
            />
          )}

          <div className="text-[11px] text-[#8D9FA4] text-right">
            Questions? Contact us at{' '}
            <a
              href={`mailto:${data?.support_email || 'support@abrainoconscious.com'}`}
              className="text-amber-400 underline"
            >
              {data?.support_email || 'support@abrainoconscious.com'}
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

// 2. Privacy Policy Page (/privacy)
export const PrivacyPage: React.FC = () => {
  const { data, isLoading } = usePublicSiteSettings();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-[#1A373E] pb-4">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-emerald-400" />
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Privacy Policy
          </h1>
        </div>
        <p className="text-xs text-[#8D9FA4] mt-1">
          {data?.brand_name || 'ABrainoConscious'} • Student Data Protection & Privacy Charter
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-6 w-1/3 bg-[#081619] rounded animate-pulse" />
          <div className="h-32 bg-[#081619] rounded-xl animate-pulse" />
        </div>
      ) : (
        <div className="space-y-6">
          <div
            className="rounded-2xl border border-[#1A373E] bg-[#081619] p-6 sm:p-8 text-xs text-[#E1E8EA] leading-relaxed space-y-4 font-sans [&>h2]:font-serif [&>h2]:text-base [&>h2]:font-bold [&>h2]:text-white [&>h3]:font-serif [&>h3]:text-sm [&>h3]:font-bold [&>h3]:text-emerald-400 [&>p]:text-[#8D9FA4] [&>ul]:list-disc [&>ul]:pl-5"
            dangerouslySetInnerHTML={{
              __html:
                data?.privacy_html ||
                '<p>We do not share your private data with third parties. You have the right to request full account erasure at any time.</p>',
            }}
          />

          <div className="text-[11px] text-[#8D9FA4] text-right">
            Privacy queries: <span className="text-white font-medium">{data?.support_email || 'support@abrainoconscious.com'}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// 3. Refund Policy Page (/refund-policy)
export const RefundPolicyPage: React.FC = () => {
  const { data, isLoading } = usePublicSiteSettings();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-[#1A373E] pb-4">
        <div className="flex items-center gap-2">
          <RotateCcw className="h-6 w-6 text-cyan-400" />
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Refund & Cancellation Policy
          </h1>
        </div>
        <p className="text-xs text-[#8D9FA4] mt-1">
          {data?.brand_name || 'ABrainoConscious'} • Cohort Program Commitments
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-6 w-1/3 bg-[#081619] rounded animate-pulse" />
          <div className="h-32 bg-[#081619] rounded-xl animate-pulse" />
        </div>
      ) : (
        <div className="space-y-6">
          <div
            className="rounded-2xl border border-[#1A373E] bg-[#081619] p-6 sm:p-8 text-xs text-[#E1E8EA] leading-relaxed space-y-4 font-sans [&>h2]:font-serif [&>h2]:text-base [&>h2]:font-bold [&>h2]:text-white [&>h3]:font-serif [&>h3]:text-sm [&>h3]:font-bold [&>h3]:text-cyan-400 [&>p]:text-[#8D9FA4] [&>ul]:list-disc [&>ul]:pl-5"
            dangerouslySetInnerHTML={{
              __html:
                data?.refund_policy_html ||
                '<p>Cohort cancellations are accepted up to 48 hours prior to Day 1. Once live challenges begin, no refunds are issued.</p>',
            }}
          />

          <div className="text-[11px] text-[#8D9FA4] text-right">
            Need help with an order? Email{' '}
            <a
              href={`mailto:${data?.support_email || 'support@abrainoconscious.com'}`}
              className="text-amber-400 underline"
            >
              {data?.support_email || 'support@abrainoconscious.com'}
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

// 4. Support & Crisis Helplines Page (/support)
export const SupportPage: React.FC = () => {
  const { data, isLoading } = usePublicSiteSettings();

  const helplines = data?.support_helplines && data.support_helplines.length > 0
    ? data.support_helplines
    : [
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
      ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Notice */}
      <div className="rounded-2xl border border-rose-500/40 bg-gradient-to-b from-rose-500/10 to-[#081619] p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3 text-rose-400">
          <PhoneCall className="h-7 w-7" />
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Need Support Right Now?
          </h1>
        </div>
        <p className="text-sm text-[#E1E8EA] leading-relaxed">
          If you are feeling overwhelmed, distressed, or experiencing an emotional crisis, please know you do not have to carry it alone. Immediate, free, and confidential support is available 24 hours a day.
        </p>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
          <span>
            <strong>Educational Scope Notice:</strong> {data?.brand_name || 'ABrainoConscious'} programs are educational self-growth cohorts, not crisis intervention, medical therapy, or clinical psychiatric care. If you are experiencing distress, please reach out to the verified helplines below.
          </span>
        </div>
      </div>

      {/* Helplines List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-white">
            Verified Crisis & Mental Health Helplines
          </h2>
          <span className="text-xs text-[#8D9FA4]">Free • Confidential • Multilingual</span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl border border-[#1A373E] bg-[#081619] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {helplines.map((hl, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[#1A373E] bg-[#081619] p-5 space-y-3 transition-colors hover:border-[#2C525A]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-serif text-base font-bold text-white">{hl.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-[#8D9FA4] mt-0.5">
                      <MapPin className="h-3 w-3 text-amber-400" />
                      <span>{hl.region}</span>
                    </div>
                  </div>
                  {hl.verified && (
                    <Badge variant="teal" className="text-[10px] shrink-0">
                      Verified
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#1A373E]">
                  <a
                    href={`tel:${hl.number.replace(/\s+/g, '')}`}
                    className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 font-mono text-sm font-bold text-amber-300 hover:bg-amber-500/20"
                  >
                    <PhoneCall className="h-3.5 w-3.5" />
                    <span>{hl.number}</span>
                  </a>

                  <div className="flex items-center gap-1 text-[11px] text-[#8D9FA4]">
                    <Clock className="h-3 w-3" />
                    <span>{hl.hours}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Studio Support Contact */}
      <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-6 space-y-3 text-xs">
        <h3 className="font-serif text-sm font-bold text-white">General Platform & Cohort Support</h3>
        <p className="text-[#8D9FA4]">
          For questions regarding session links, program access, or technical issues:
        </p>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div>
            <span className="text-[#8D9FA4]">Email: </span>
            <a
              href={`mailto:${data?.support_email || 'support@abrainoconscious.com'}`}
              className="text-amber-400 font-medium underline"
            >
              {data?.support_email || 'support@abrainoconscious.com'}
            </a>
          </div>
          {data?.support_whatsapp && (
            <div>
              <span className="text-[#8D9FA4]">WhatsApp: </span>
              <span className="text-emerald-400 font-mono font-medium">{data.support_whatsapp}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
