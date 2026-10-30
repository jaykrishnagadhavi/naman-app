import React, { useState } from 'react';
import {
  Button, Input, Textarea, Card, Badge, Checkbox, Switch,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Avatar, Tooltip, Skeleton, EmptyState, Toast,
  ProgressRing, CountdownTimer, PosterCard, ContentRail, HeroBanner,
  CategoryChips, SearchBar, StatsStrip, BadgeTile,
  SectionBand, StoryPanel, EmpathyList, NumberedSteps, ModuleAccordion,
  CreatorCard, TestimonialCard, PricingCard, FaqAccordion, YouTubeVideoCard,
  PillarCard, JoinButton, Img, ImageUploader
} from '../index';
import { Sun, Moon, HeartHandshake, Brain } from 'lucide-react';

export const DesignSystemPage: React.FC = () => {
  const [isDark, setIsDark] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchVal, setSearchVal] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className={isDark ? 'dark bg-[#040C0E] text-[#E1E8EA] min-h-screen' : 'light bg-[#F8FAFB] text-[#233539] min-h-screen'}>
      {/* Top Header with Theme Switch */}
      <header className="sticky top-0 z-50 border-b border-[#1A373E] bg-[#081619]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-xl font-bold text-white">ABrainoConscious Design System</h1>
          <p className="text-xs text-[#8D9FA4]">Tokens, Radix Primitives, Streaming & Landing Components</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsDark(!isDark)}
            className="flex items-center gap-1.5"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-800" />}
            <span>Mode: {isDark ? 'Dark (Default)' : 'Light'}</span>
          </Button>
          <a href="/" className="text-xs text-amber-400 hover:underline">
            &larr; Back to App
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
        {/* 1. COLOR PALETTE */}
        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-bold text-[#F8FAFA]">1. Color Tokens & Chromatic Architecture</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
            <div className="rounded-xl border border-[#1A373E] bg-[#040C0E] p-4 text-white">
              <span className="block font-bold">Base Dark</span>
              <span className="text-[#8D9FA4]">#040C0E</span>
            </div>
            <div className="rounded-xl border border-[#1A373E] bg-[#081619] p-4 text-white">
              <span className="block font-bold">Surface 1</span>
              <span className="text-[#8D9FA4]">#081619</span>
            </div>
            <div className="rounded-xl border border-[#1A373E] bg-[#0E2024] p-4 text-white">
              <span className="block font-bold">Surface 2</span>
              <span className="text-[#8D9FA4]">#0E2024</span>
            </div>
            <div className="rounded-xl border border-[#1A373E] bg-[#152B30] p-4 text-white">
              <span className="block font-bold">Surface 3</span>
              <span className="text-[#8D9FA4]">#152B30</span>
            </div>
            <div className="rounded-xl border border-amber-600 bg-[#F5871F] p-4 text-black">
              <span className="block font-bold">Saffron Accent</span>
              <span>#F5871F</span>
            </div>
            <div className="rounded-xl border border-[#E0DBD0] bg-[#F7F4EB] p-4 text-[#142225]">
              <span className="block font-bold">Cream Paper</span>
              <span className="text-[#52676B]">#F7F4EB</span>
            </div>
          </div>
        </section>

        {/* 2. BASE INTERACTIVE COMPONENTS */}
        <section className="space-y-6">
          <h2 className="font-serif text-2xl font-bold text-[#F8FAFA]">2. Base Components (Radix + Tailwind)</h2>

          {/* Buttons */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-500">Buttons</h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary Saffron</Button>
              <Button variant="cta">Large CTA Button</Button>
              <Button variant="secondary">Secondary Dark</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="primary" isLoading={true}>Loading</Button>
            </div>
          </div>

          {/* Cards & Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <Card variant="default">
              <h4 className="text-sm font-bold text-white">Default Card</h4>
              <p className="text-xs text-[#8D9FA4] mt-1">Standard dark container.</p>
            </Card>
            <Card variant="interactive">
              <h4 className="text-sm font-bold text-white">Interactive Card</h4>
              <p className="text-xs text-[#8D9FA4] mt-1">Hover lift and border glow.</p>
            </Card>
            <Card variant="paper">
              <h4 className="text-sm font-bold text-[#142225]">Warm Paper Card</h4>
              <p className="text-xs text-[#52676B] mt-1">Cream paper surface for storytelling.</p>
            </Card>
          </div>

          {/* Inputs & Form Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <Input label="Student Name" placeholder="e.g. Priya Sharma" />
            <Input label="Email Address" type="email" placeholder="priya@example.com" error="Please enter a valid email" />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#E1E8EA]">Target Pillar</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose Pillar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emotional">Emotional Resilience</SelectItem>
                  <SelectItem value="mental">Mental Clarity</SelectItem>
                  <SelectItem value="academic">Academic Mastery</SelectItem>
                  <SelectItem value="personal">Personal Momentum</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Textarea label="Daily Reflection Journal" placeholder="Write today's key takeaways here..." />
            <div className="space-y-4 pt-4">
              <Checkbox id="c1" label="I agree to receive daily challenge live session links" defaultChecked />
              <Checkbox id="c2" label="Send me study reminders 30 mins before live calls" />
              <div className="flex items-center gap-3 pt-2">
                <Switch id="s1" defaultChecked />
                <label htmlFor="s1" className="text-xs text-[#E1E8EA]">Daily Habit Streak Protection</label>
              </div>
            </div>
          </div>

          {/* Tabs & Table */}
          <div className="space-y-4 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-500">Tabs & Table</h3>
            <Tabs defaultValue="sessions">
              <TabsList>
                <TabsTrigger value="sessions">Live Sessions</TabsTrigger>
                <TabsTrigger value="tasks">Daily Tasks</TabsTrigger>
              </TabsList>
              <TabsContent value="sessions">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Pillar</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-bold">Day 01</TableCell>
                      <TableCell>Quieting the Inner Critic</TableCell>
                      <TableCell>Mental</TableCell>
                      <TableCell><Badge variant="teal">Completed</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-bold">Day 02</TableCell>
                      <TableCell>Active Study Sprint Protocol</TableCell>
                      <TableCell>Academic</TableCell>
                      <TableCell><Badge variant="amber">Live Today</Badge></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="tasks">
                <p className="text-xs text-[#8D9FA4]">Daily tasks view.</p>
              </TabsContent>
            </Tabs>
          </div>

          {/* Dialog, Dropdown, Avatar, Tooltip, Toast, Skeleton, EmptyState */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary">Open Radix Dialog Modal</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>7-Day Guarantee Assurance</DialogTitle>
                  <DialogDescription>
                    All ABrainoConscious programs come with an unconditional 100% money-back guarantee within 7 days.
                  </DialogDescription>
                </DialogHeader>
                <div className="pt-4 flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>Close</Button>
                  <Button variant="primary" size="sm" onClick={() => setDialogOpen(false)}>Got It</Button>
                </div>
              </DialogContent>
            </Dialog>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary">Student Menu &darr;</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>My Certificates</DropdownMenuItem>
                <DropdownMenuItem>Order History & Invoices</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-400">Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Avatar fallbackText="NK" alt="Naman" />

            <Tooltip content="Earned when attending 7 consecutive live sessions">
              <Badge variant="amber">Hover for Tooltip</Badge>
            </Tooltip>

            <Skeleton className="h-9 w-24" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <Toast title="New Announcement from Naman" description="Workbook for Day 4 has been uploaded." type="info" />
            <EmptyState title="No Active Quizzes" description="Quizzes unlock after completing lesson 3." />
          </div>
        </section>

        {/* 3. PHOTO PIPELINE & TREATMENTS */}
        <section className="space-y-6">
          <h2 className="font-serif text-2xl font-bold text-[#F8FAFA]">3. Photo Pipeline & Treatments (`Img` Component)</h2>
          <p className="text-xs text-[#8D9FA4]">
            Responsive AVIF/WebP srcset, zero CLS reserved aspect ratio, blur-up placeholder, and CSS-only grading.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-white block">Hero Portrait with Dark Gradient</span>
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden border border-[#1A373E]">
                <Img
                  id="naman/naman-header"
                  alt="Naman teaching portrait"
                  aspectRatio="4/5"
                  focalPoint="50% 32%"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#040C0E] via-transparent to-transparent opacity-80" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-white block">Brand Circular Logo Emblem</span>
              <div className="flex h-48 items-center justify-center rounded-xl border border-[#1A373E] bg-[#0E2024]">
                <div className="h-28 w-28 rounded-full overflow-hidden border-2 border-amber-500 shadow-glow">
                  <Img
                    id="brand/logo"
                    alt="Brand badge"
                    aspectRatio="1/1"
                    className="h-full w-full object-cover scale-125"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-white block">Missing Image Gradient Fallback</span>
              <Img
                id="missing/program-poster"
                alt="Fallback example"
                aspectRatio="4/5"
                fallbackTitle="Cognitive Defusion Mastery Challenge"
              />
            </div>
          </div>
        </section>

        {/* 4. ADMIN IMAGE UPLOADER COMPONENT */}
        <section className="space-y-6">
          <h2 className="font-serif text-2xl font-bold text-[#F8FAFA]">4. Admin Image Uploader (Crop, Zoom & Live Multi-Surface Preview)</h2>
          <ImageUploader />
        </section>

        {/* 5. STREAMING STYLE COMPONENTS */}
        <section className="space-y-6">
          <h2 className="font-serif text-2xl font-bold text-[#F8FAFA]">5. Streaming-Style Components</h2>

          <StatsStrip />

          {/* Hero Banner Variant */}
          <HeroBanner
            variant="next-session"
            title="Day 4: Taming the Inner Critic Before Exam Sprints"
            subtitle="Join Naman live on Zoom as we break down active cognitive grounding exercises."
            programTitle="21-Day Mindset Reset"
            targetDate={new Date(Date.now() + 1000 * 60 * 60 * 18)}
          />

          <div className="flex flex-wrap items-center gap-4">
            <CategoryChips
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
            <SearchBar value={searchVal} onChange={setSearchVal} />
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <ProgressRing progress={68} showText />
              <span className="text-xs text-[#8D9FA4]">Course Progress (68%)</span>
            </div>
            <CountdownTimer targetDate={new Date(Date.now() + 1000 * 60 * 60 * 48)} label="Registration closes in" />
          </div>

          {/* Content Rail with PosterCards */}
          <ContentRail title="Trending Rails (Peterson Academy Style)">
            <PosterCard
              id="ds-1"
              title="21-Day Focus & Emotional Mastery"
              category="Emotional"
              aspectRatio="2:3"
              rankNumber={1}
              lessonCount={21}
              pricePaise={99900}
            />
            <PosterCard
              id="ds-2"
              title="Deep Work & Anti-Procrastination"
              category="Academic"
              aspectRatio="2:3"
              rankNumber={2}
              lessonCount={14}
              pricePaise={79900}
            />
            <PosterCard
              id="ds-3"
              title="Overcoming Cognitive Distortions"
              category="Mental"
              aspectRatio="2:3"
              rankNumber={3}
              lessonCount={18}
              progressPercent={45}
            />
          </ContentRail>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <BadgeTile title="Day 1 Complete" description="Finished first daily assignment." isEarned={true} earnedDate="Oct 2026" />
            <BadgeTile title="7-Day Streak" description="Maintained active attendance for 7 days." isEarned={true} earnedDate="Oct 2026" />
            <BadgeTile title="21-Day Finisher" description="Completed the entire challenge." isEarned={false} />
            <BadgeTile title="Active Contributor" description="Shared 5 reflections." isEarned={false} />
          </div>
        </section>

        {/* 6. LANDING STYLE COMPONENTS */}
        <section className="space-y-6">
          <h2 className="font-serif text-2xl font-bold text-[#F8FAFA]">6. Landing Story & Persuasion Components</h2>

          <SectionBand variant="paper">
            <h3 className="font-serif text-xl font-bold mb-4">Cream Paper Section Band</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StoryPanel
                number="01"
                pillar="Mental"
                title="The Overthinking Trap"
                beforeText="Paralyzed by doubts."
                afterText="Structured action sprints."
              />
              <StoryPanel
                number="02"
                pillar="Academic"
                title="Exam Pressure"
                beforeText="Drowning in syllabus dread."
                afterText="Active recall clarity."
              />
            </div>
            <div className="mt-8">
              <EmpathyList
                items={[
                  { id: '1', question: 'Do you feel stuck studying for hours without retention?', subtext: 'Passive review exhausts your brain.' },
                  { id: '2', question: 'Does failure derail your entire confidence?', subtext: 'Untrained emotional resilience.' }
                ]}
              />
            </div>
          </SectionBand>

          <NumberedSteps />

          <ModuleAccordion
            modules={[
              {
                number: '01',
                title: 'Emotional De-escalation & Quieting the Inner Critic',
                duration: '4 Lessons • 58 Mins',
                description: 'Tackle the underlying physiological anxiety.',
                lessons: ['De-tangling identity from performance', '90-Second Emotional Reset']
              }
            ]}
          />

          <CreatorCard />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TestimonialCard
              item={{
                id: '1',
                name: 'Rohan Sharma',
                role: 'Engineering Student',
                pillar: 'Academic',
                quote: 'Naman’s framework completely changed how I prepare for exams.'
              }}
            />
            <PricingCard
              title="21-Day Live Challenge"
              description="Guided cohort with Naman."
              pricePaise={99900}
              compareAtPricePaise={249900}
              features={['21 live calls', 'Daily workbook', 'Community circle']}
              isFeatured={true}
            />
            <YouTubeVideoCard
              videoId="dQw4w9WgXcQ"
              title="Stop Overthinking and Start Taking Action"
              duration="14:20"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <PillarCard
              title="Emotional Resilience"
              tagline="Quiet Inner Stability"
              description="Learn to de-escalate anxiety and stop letting self-criticism paralyze your progress."
              icon={<HeartHandshake className="h-6 w-6" />}
            />
            <PillarCard
              title="Mental Clarity"
              tagline="Sharp Focus, Quiet Thoughts"
              description="Eliminate brain fog, master cognitive defusion, and navigate heavy study loads."
              icon={<Brain className="h-6 w-6" />}
            />
          </div>

          <FaqAccordion
            items={[
              { question: 'How long do I have access to the programs?', answer: 'Lifetime access for video courses; live cohort recordings are permanently stored.' },
              { question: 'What is the refund policy?', answer: '7-day unconditional 100% money-back guarantee.' }
            ]}
          />

          <div className="text-center pt-4">
            <JoinButton />
          </div>
        </section>
      </main>
    </div>
  );
};

export default DesignSystemPage;
