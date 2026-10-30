import React from 'react';
import { Youtube, Instagram, Check, Award, Radio } from 'lucide-react';
import { cn } from '@abrainoconscious/shared';
import { Img } from './Img';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './Feedback';

export interface ModuleItem {
  number: string; // '01', '02', '03'
  title: string;
  duration: string;
  description: string;
  lessons: string[];
}

export interface ModuleAccordionProps {
  modules: ModuleItem[];
  className?: string;
}

export const ModuleAccordion: React.FC<ModuleAccordionProps> = ({ modules, className }) => {
  return (
    <Accordion type="single" collapsible className={cn('w-full space-y-3', className)}>
      {modules.map((m) => (
        <AccordionItem
          key={m.number}
          value={m.number}
          className="rounded-xl border border-[#1A373E] bg-[#0E2024] px-5 py-1 text-white shadow-ambient data-[state=open]:border-amber-500/40"
        >
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-4 text-left">
              <span className="font-serif text-lg font-bold text-amber-500">{m.number}</span>
              <div>
                <h4 className="font-serif text-sm sm:text-base font-semibold text-[#F8FAFA]">{m.title}</h4>
                <p className="text-xs text-[#8D9FA4] font-normal">{m.duration}</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4 text-xs text-[#8D9FA4] space-y-3 border-t border-[#1A373E]/60">
            <p className="leading-relaxed">{m.description}</p>
            <div className="space-y-1.5 pl-2">
              <span className="text-[11px] font-semibold text-white uppercase tracking-wider block">Key Lessons:</span>
              {m.lessons.map((lesson, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-[#E1E8EA]">
                  <Check className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>{lesson}</span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export interface CreatorCardProps {
  name?: string;
  bio?: string;
  credentials?: string[];
  youtubeLink?: string;
  podcastLink?: string;
  instagramLink?: string;
  className?: string;
}

export const CreatorCard: React.FC<CreatorCardProps> = ({
  name = 'Naman',
  bio = 'Founder of ABrainoConscious, educator, and content creator dedicated to helping students and ambitious young people cut through mental clutter and build resilient emotional, academic, and personal foundations.',
  credentials = [
    'Over 100,000+ passionate YouTube subscribers',
    'Guided 25,000+ students across live cohorts and workshops',
    'Practical, jargon-free frameworks grounded in real human empathy'
  ],
  youtubeLink = 'https://youtube.com/@abrainoconscious',
  podcastLink = '#',
  instagramLink = '#',
  className
}) => {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border border-[#1A373E] bg-[#081619] p-6 sm:p-10 shadow-2xl text-white',
        className
      )}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Creator Portrait using real photo */}
        <div className="lg:col-span-5 relative">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-2xl border-2 border-[#1A373E] bg-[#040C0E] shadow-2xl">
            <Img
              id="naman/naman-header"
              alt="Naman teaching with a marker against studio backdrop"
              aspectRatio="4/5"
              focalPoint="50% 32%"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#081619] via-transparent to-transparent opacity-60" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-xl bg-black/80 px-3 py-2 backdrop-blur-md border border-white/10">
              <span className="font-serif text-sm font-bold text-white">{name}</span>
              <span className="text-[10px] text-amber-400 font-medium">Founder & Instructor</span>
            </div>
          </div>
        </div>

        {/* Bio & Links */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
              Meet Your Mentor
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#F8FAFA]">
              "No hype, no shame. Just practical clarity for your real struggles."
            </h3>
          </div>

          <p className="text-sm text-[#E1E8EA] leading-relaxed">
            {bio}
          </p>

          <div className="space-y-2 pt-1">
            {credentials.map((cred, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-[#8D9FA4]">
                <Award className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <span>{cred}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#1A373E]">
            <a
              href={youtubeLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg bg-[#0E2024] px-4 py-2 text-xs font-semibold text-white border border-[#1A373E] hover:border-red-500 hover:text-red-400 transition-colors"
            >
              <Youtube className="h-4 w-4" /> YouTube Channel
            </a>
            {podcastLink && (
              <a
                href={podcastLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-lg bg-[#0E2024] px-4 py-2 text-xs font-semibold text-white border border-[#1A373E] hover:border-amber-500 hover:text-amber-400 transition-colors"
              >
                <Radio className="h-4 w-4" /> Podcast
              </a>
            )}
            <a
              href={instagramLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg bg-[#0E2024] px-4 py-2 text-xs font-semibold text-white border border-[#1A373E] hover:border-pink-500 hover:text-pink-400 transition-colors"
            >
              <Instagram className="h-4 w-4" /> Instagram
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  pillar: string;
  quote: string;
  avatarText?: string;
}

export const TestimonialCard: React.FC<{ item: TestimonialItem; className?: string }> = ({
  item,
  className
}) => {
  return (
    <div
      className={cn(
        'relative flex flex-col justify-between rounded-2xl border border-[#1A373E] bg-[#0E2024] p-6 text-white shadow-ambient space-y-4 select-none',
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-[#1A373E] pb-3">
        <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
          {item.pillar} Pillar
        </span>
        <span className="rounded bg-black/60 px-2 py-0.5 text-[10px] text-[#8D9FA4] italic border border-white/5">
          Sample Testimonial
        </span>
      </div>

      <p className="font-serif text-sm italic text-[#E1E8EA] leading-relaxed">
        "{item.quote}"
      </p>

      <div className="flex items-center gap-3 pt-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#152B30] text-xs font-bold text-amber-400 border border-[#1A373E]">
          {item.avatarText || item.name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h5 className="text-xs font-semibold text-white">{item.name}</h5>
          <p className="text-[10px] text-[#8D9FA4]">{item.role}</p>
        </div>
      </div>
    </div>
  );
};

