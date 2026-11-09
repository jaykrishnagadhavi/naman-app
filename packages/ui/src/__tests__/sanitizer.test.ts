import { describe, it, expect } from 'vitest';
import { sanitizeRichText } from '../components/RichTextEditor';

describe('Rich Text HTML Sanitizer (DOMPurify Security)', () => {
  it('strips malicious <script> tags and payloads completely', () => {
    const maliciousInput = '<p>Normal text</p><script>alert("hacked")</script><script src="https://evil.com/xss.js"></script>';
    const sanitized = sanitizeRichText(maliciousInput);
    expect(sanitized).not.toContain('<script');
    expect(sanitized).not.toContain('alert');
    expect(sanitized).not.toContain('evil.com');
    expect(sanitized).toContain('<p>Normal text</p>');
  });

  it('strips inline execution handlers (onerror, onload, onclick, onmouseover)', () => {
    const hostileAttributes = '<img src="invalid.jpg" onerror="alert(1)" /><p onclick="stealCookies()">Click me</p>';
    const sanitized = sanitizeRichText(hostileAttributes);
    expect(sanitized).not.toContain('onerror');
    expect(sanitized).not.toContain('onclick');
    expect(sanitized).not.toContain('alert');
    expect(sanitized).not.toContain('stealCookies');
  });

  it('strips javascript: protocol pseudo-URLs from links', () => {
    const hostileLink = '<a href="javascript:alert(1)">Click to claim</a>';
    const sanitized = sanitizeRichText(hostileLink);
    expect(sanitized).not.toContain('javascript:');
  });

  it('strips unauthorized arbitrary iframes but permits YouTube and Vimeo', () => {
    const hostileIframe = '<iframe src="https://evil-phishing.com/login"></iframe>';
    const safeYouTube = '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" allowfullscreen></iframe>';
    const safeVimeo = '<iframe src="https://player.vimeo.com/video/123456789"></iframe>';

    expect(sanitizeRichText(hostileIframe)).toBe('');
    expect(sanitizeRichText(safeYouTube)).toContain('youtube.com');
    expect(sanitizeRichText(safeVimeo)).toContain('vimeo.com');
  });

  it('preserves legitimate curriculum formatting elements', () => {
    const validCurriculum = `
      <h2>Week 1: Foundations of Presence</h2>
      <p>In this module, you will discover:</p>
      <ul>
        <li><strong>Daily breathwork protocols</strong> to reset nervous system tone</li>
        <li><em>Cognitive reframing exercises</em></li>
      </ul>
      <blockquote>"Discipline is the bridge between goals and accomplishment."</blockquote>
    `;
    const sanitized = sanitizeRichText(validCurriculum);
    expect(sanitized).toContain('<h2>Week 1: Foundations of Presence</h2>');
    expect(sanitized).toContain('<strong>Daily breathwork protocols</strong>');
    expect(sanitized).toContain('<em>Cognitive reframing exercises</em>');
    expect(sanitized).toContain('<blockquote>');
    expect(sanitized).toContain('<ul>');
    expect(sanitized).toContain('<li>');
  });
});

