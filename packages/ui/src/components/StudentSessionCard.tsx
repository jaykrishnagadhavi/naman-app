import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  ExternalLink,
  Video,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Radio,
  FileText,
  Eye,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { formatIST, formatISTTimeOnly, formatISTDateOnly } from '@abrainoconscious/shared';

export interface StudentSessionCardProps {
  dayNumber: number;
  title: string;
  scheduledAt: string;
  livePlatform?: 'zoom' | 'meet' | 'youtube' | 'other';
  status?: 'scheduled' | 'live' | 'ended';
  description?: string | null;
  taskTitle?: string | null;
  taskBody?: string | null;
  resources?: Array<{ title: string; url: string }>;
  liveUrl?: string | null;
  recordingUrl?: string | null;
  recordingVisible?: boolean;
  isPreview?: boolean;
  taskCompleted?: boolean;
  onToggleTask?: (done: boolean) => void;
  onJoinLive?: () => void;
  onWatchRecording?: () => void;
  isJoining?: boolean;
  joinDisabledReason?: string;
  hasLiveLink?: boolean;
  className?: string;
}

export const StudentSessionCard: React.FC<StudentSessionCardProps> = ({
  dayNumber,
  title,
  scheduledAt,
  livePlatform = 'zoom',
  status = 'scheduled',
  description,
  taskTitle,
  taskBody,
  resources = [],
  liveUrl,
  recordingUrl,
  recordingVisible = false,
  isPreview = false,
  taskCompleted,
  onToggleTask,
  onJoinLive,
  onWatchRecording,
  isJoining = false,
  joinDisabledReason,
  hasLiveLink = false,
  className = '',
}) => {
  const [taskExpanded, setTaskExpanded] = useState(true);
  const [internalTaskDone, setInternalTaskDone] = useState(false);

  const isDone = taskCompleted !== undefined ? taskCompleted : internalTaskDone;

  const handleToggle = () => {
    const next = !isDone;
    setInternalTaskDone(next);
    onToggleTask?.(next);
  };

  const isLive = status === 'live';
  const isEnded = status === 'ended';
  const isScheduled = status === 'scheduled';

  // Join window calculation
  const scheduledTime = new Date(scheduledAt).getTime();
  const now = Date.now();
  const windowOpenTime = scheduledTime - 60 * 60 * 1000;
  const windowCloseTime = scheduledTime + 6 * 3600 * 1000;
  const isWithinWindow = now >= windowOpenTime && now <= windowCloseTime;
  const canJoin = isLive || (isWithinWindow && !isEnded) || (hasLiveLink && !isEnded);

  const platformLabels: Record<string, string> = {
    zoom: 'Zoom Live',
    meet: 'Google Meet',
    youtube: 'YouTube Live',
    other: 'Live Stream',
  };

  const platformBadge = platformLabels[livePlatform] || 'Live Stream';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border transition-all duration-200 ${
        isLive
          ? 'border-red-500/50 bg-[#0A1D20] shadow-[0_0_30px_rgba(239,68,68,0.15)]'
          : isWithinWindow && !isEnded
          ? 'border-amber-500/50 bg-[#0A1D20] shadow-[0_0_30px_rgba(245,135,31,0.15)]'
          : 'border-[#1A373E] bg-[#081619] hover:border-[#234A54]'
      } ${className}`}
    >
      {/* Student View Preview Header (if preview mode) */}
      {isPreview && (
        <div className="flex items-center justify-between border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-400">
          <div className="flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            <span>STUDENT DASHBOARD PREVIEW</span>
          </div>
          <span className="text-[10px] text-amber-400/80 uppercase tracking-wider">
            Draft Data • How Enrolled Students See This
          </span>
        </div>
      )}

      {/* Main Card Content */}
      <div className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-amber-500/20 px-2.5 py-0.5 font-mono text-xs font-bold text-amber-400">
                DAY {dayNumber}
              </span>
              <span className="rounded-md border border-[#1A373E] bg-[#0D2226] px-2.5 py-0.5 text-xs text-[#8D9FA4]">
                {platformBadge}
              </span>

              {isLive && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-bold text-red-400 animate-pulse">
                  <Radio className="h-3 w-3" />
                  LIVE NOW
                </span>
              )}

              {isEnded && (
                <span className="rounded-md bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-400">
                  Completed
                </span>
              )}

              {isScheduled && (
                <span className="rounded-md bg-blue-500/10 px-2.5 py-0.5 text-xs text-blue-400">
                  Scheduled
                </span>
              )}
            </div>

            <h3 className="font-serif text-xl font-bold text-white sm:text-2xl">{title}</h3>

            {description && (
              <p className="text-sm text-[#A0B1B5] leading-relaxed max-w-2xl">{description}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-[#8D9FA4]">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-amber-400" />
                {formatISTDateOnly(scheduledAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                {formatISTTimeOnly(scheduledAt)}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            {canJoin ? (
              <button
                type="button"
                onClick={onJoinLive}
                disabled={isJoining || (isPreview && !liveUrl)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-bold text-black shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              >
                {isJoining ? (
                  <Loader2 className="h-4 w-4 animate-spin text-black" />
                ) : (
                  <Radio className="h-4 w-4 animate-pulse text-black" />
                )}
                {isJoining ? 'Connecting...' : 'Join Live Session'}
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            ) : isEnded ? (
              (recordingVisible || recordingUrl) ? (
                <button
                  type="button"
                  onClick={onWatchRecording}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#152B30] hover:bg-[#1E3B42] border border-[#234A54] px-5 py-2.5 text-sm font-semibold text-white transition-all"
                >
                  <Video className="h-4 w-4 text-amber-400" />
                  Watch Recording
                </button>
              ) : (
                <div className="rounded-xl border border-[#1A373E] bg-[#0A1719] px-4 py-2 text-xs text-[#8D9FA4]">
                  Recording will be available soon
                </div>
              )
            ) : (
              <div className="space-y-1 text-right">
                <div className="rounded-xl border border-[#1A373E] bg-[#0D2226] px-4 py-2 text-center">
                  <span className="text-[11px] text-[#8D9FA4] block">Starts at</span>
                  <span className="font-mono text-xs font-semibold text-amber-400">
                    {formatIST(scheduledAt, true)}
                  </span>
                </div>
                <span className="text-[10px] text-[#556B71] block">
                  Link opens 60 mins before call
                </span>
              </div>
            )}

            {joinDisabledReason && (
              <div className="flex items-center gap-1 text-[11px] text-amber-400/90">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{joinDisabledReason}</span>
              </div>
            )}
          </div>
        </div>

        {/* Daily Task Section */}
        {(taskTitle || taskBody) && (
          <div className="mt-6 rounded-xl border border-[#1A373E] bg-[#051113] p-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setTaskExpanded(!taskExpanded)}
                className="flex items-center gap-2 text-left"
              >
                <FileText className="h-4 w-4 text-amber-400" />
                <span className="font-serif text-sm font-bold text-white">
                  Today's Task: {taskTitle || `Day ${dayNumber} Reflection & Action`}
                </span>
                {taskExpanded ? (
                  <ChevronUp className="h-4 w-4 text-[#8D9FA4]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[#8D9FA4]" />
                )}
              </button>

              <button
                type="button"
                onClick={handleToggle}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  isDone
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-[#0D2226] text-[#8D9FA4] hover:text-white border border-transparent'
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {isDone ? 'Task Completed' : 'Mark Complete'}
              </button>
            </div>

            {taskExpanded && taskBody && (
              <div
                className="prose prose-invert prose-sm mt-3 border-t border-[#1A373E]/60 pt-3 text-[#A0B1B5] leading-relaxed"
                dangerouslySetInnerHTML={{ __html: taskBody }}
              />
            )}
          </div>
        )}

        {/* Resources & Downloadables */}
        {resources && resources.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t border-[#1A373E]/40">
            <span className="text-xs font-medium text-[#8D9FA4]">Resources:</span>
            {resources.map((res, idx) => (
              <a
                key={idx}
                href={isPreview ? '#' : res.url}
                target={isPreview ? undefined : '_blank'}
                rel="noreferrer"
                onClick={(e) => isPreview && e.preventDefault()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#1A373E] bg-[#0A1719] px-2.5 py-1 text-xs text-amber-400 hover:border-amber-500/40 hover:bg-[#0E2024] transition-all"
              >
                <ExternalLink className="h-3 w-3" />
                <span>{res.title}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
