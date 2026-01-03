#!/usr/bin/env python3
"""
YouTube Transcript Extractor
Fetches transcripts from YouTube videos for business insights analysis.

Usage:
    python get_transcript.py <URL|VIDEO_ID> [options]

Options:
    --timestamps    Include timestamps in output
    --format=FORMAT Output format: txt, md, json (default: txt)
    --language=LANG Language code (default: en)

Examples:
    python get_transcript.py https://youtu.be/abc123xyz
    python get_transcript.py abc123xyz --timestamps
    python get_transcript.py "https://youtube.com/watch?v=abc123xyz" --format=md
"""

import sys
import re
import json
from datetime import datetime

try:
    from youtube_transcript_api import YouTubeTranscriptApi
    from youtube_transcript_api._errors import (
        TranscriptsDisabled,
        NoTranscriptFound,
        VideoUnavailable
    )
except ImportError:
    print("ERROR: youtube-transcript-api not installed")
    print("Install with: pip install youtube-transcript-api")
    sys.exit(1)


def extract_video_id(url: str) -> str:
    """
    Extract video ID from various YouTube URL formats.

    Supports:
        - youtube.com/watch?v=ID
        - youtu.be/ID
        - youtube.com/embed/ID
        - Raw 11-character ID
    """
    url = url.strip()

    # Already a video ID (11 alphanumeric chars with - and _)
    if re.match(r'^[a-zA-Z0-9_-]{11}$', url):
        return url

    # youtube.com/watch?v=ID
    match = re.search(r'[?&]v=([a-zA-Z0-9_-]{11})', url)
    if match:
        return match.group(1)

    # youtu.be/ID or youtube.com/embed/ID
    match = re.search(r'(?:youtu\.be/|youtube\.com/embed/)([a-zA-Z0-9_-]{11})', url)
    if match:
        return match.group(1)

    raise ValueError(f"Could not extract video ID from: {url}")


def format_timestamp(seconds: float) -> str:
    """Convert seconds to HH:MM:SS or MM:SS format."""
    total_seconds = int(seconds)
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    secs = total_seconds % 60

    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"


def get_transcript(video_id: str, language: str = 'en') -> list:
    """
    Fetch transcript from YouTube video.

    Args:
        video_id: YouTube video ID
        language: Preferred language code

    Returns:
        List of transcript entries with 'text', 'start', and 'duration' keys

    Raises:
        Exception with descriptive message if transcript unavailable
    """
    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)

        # Try to get manually created transcript in preferred language
        try:
            transcript = transcript_list.find_manually_created_transcript([language])
        except:
            # Fall back to auto-generated in preferred language
            try:
                transcript = transcript_list.find_generated_transcript([language])
            except:
                # Fall back to any available transcript
                available = list(transcript_list)
                if available:
                    transcript = available[0]
                else:
                    raise NoTranscriptFound(video_id, [], None)

        return transcript.fetch()

    except TranscriptsDisabled:
        raise Exception(f"Transcripts are disabled for video: {video_id}")
    except NoTranscriptFound:
        raise Exception(f"No transcript found for video: {video_id}")
    except VideoUnavailable:
        raise Exception(f"Video is unavailable: {video_id}")
    except Exception as e:
        raise Exception(f"Error fetching transcript: {str(e)}")


def calculate_duration(entries: list) -> str:
    """Calculate total video duration from transcript entries."""
    if not entries:
        return "00:00"

    last_entry = entries[-1]
    total_seconds = last_entry['start'] + last_entry.get('duration', 0)
    return format_timestamp(total_seconds)


def format_plain_text(entries: list, timestamps: bool = False) -> str:
    """Format transcript as plain text."""
    lines = []

    for entry in entries:
        text = entry['text'].strip()
        if not text:
            continue

        if timestamps:
            time_str = format_timestamp(entry['start'])
            lines.append(f"[{time_str}] {text}")
        else:
            lines.append(text)

    return '\n'.join(lines)


def format_markdown(entries: list, video_id: str, timestamps: bool = False) -> str:
    """Format transcript as markdown."""
    duration = calculate_duration(entries)
    url = f"https://youtube.com/watch?v={video_id}"

    md = f"""# YouTube Transcript

**Video ID:** {video_id}
**URL:** {url}
**Duration:** {duration}
**Extracted:** {datetime.now().strftime('%Y-%m-%d %H:%M')}

---

## Transcript

"""

    for entry in entries:
        text = entry['text'].strip()
        if not text:
            continue

        if timestamps:
            time_str = format_timestamp(entry['start'])
            md += f"**[{time_str}]** {text}\n\n"
        else:
            md += f"{text}\n\n"

    return md


def format_json(entries: list, video_id: str) -> str:
    """Format transcript as JSON for programmatic use."""
    output = {
        'video_id': video_id,
        'url': f"https://youtube.com/watch?v={video_id}",
        'duration': calculate_duration(entries),
        'extracted_at': datetime.now().isoformat(),
        'entry_count': len(entries),
        'entries': [
            {
                'timestamp': format_timestamp(e['start']),
                'start_seconds': e['start'],
                'duration': e.get('duration', 0),
                'text': e['text'].strip()
            }
            for e in entries if e['text'].strip()
        ]
    }
    return json.dumps(output, indent=2)


def parse_args(args: list) -> dict:
    """Parse command line arguments."""
    if not args:
        return {'help': True}

    result = {
        'url': None,
        'timestamps': False,
        'format': 'txt',
        'language': 'en',
        'help': False
    }

    for arg in args:
        if arg in ('-h', '--help'):
            result['help'] = True
        elif arg == '--timestamps':
            result['timestamps'] = True
        elif arg.startswith('--format='):
            result['format'] = arg.split('=', 1)[1].lower()
        elif arg.startswith('--language='):
            result['language'] = arg.split('=', 1)[1]
        elif not arg.startswith('-'):
            result['url'] = arg

    return result


def print_help():
    """Print usage information."""
    print(__doc__)


def main():
    args = parse_args(sys.argv[1:])

    if args['help'] or not args['url']:
        print_help()
        sys.exit(0 if args['help'] else 1)

    try:
        # Extract video ID
        video_id = extract_video_id(args['url'])

        # Fetch transcript
        entries = get_transcript(video_id, args['language'])

        if not entries:
            print("ERROR: Transcript is empty", file=sys.stderr)
            sys.exit(1)

        # Format output
        fmt = args['format']
        timestamps = args['timestamps']

        if fmt == 'json':
            output = format_json(entries, video_id)
        elif fmt == 'md':
            output = format_markdown(entries, video_id, timestamps)
        else:
            output = format_plain_text(entries, timestamps)

        print(output)

    except ValueError as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
