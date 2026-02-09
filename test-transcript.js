const { YoutubeTranscript } = require('@danielxceron/youtube-transcript');

async function testTranscript() {
    const videoIds = [
        'm4T4Lne7Zos',  // User's video
        'dQw4w9WgXcQ',  // Popular video
        'jNQXAC9IVRw',  // Educational video  
    ];

    for (const videoId of videoIds) {
        console.log(`\n🎬 Testing video: ${videoId}`);
        console.log('='.repeat(50));
        try {
            const transcript = await YoutubeTranscript.fetchTranscript(videoId);
            console.log(`✅ SUCCESS! Got ${transcript.length} segments`);
            if (transcript.length > 0) {
                console.log('First segment:', transcript[0]);
                console.log('Total text chars:', transcript.map(t => t.text).join(' ').length);
            }
        } catch (error) {
            console.log(`❌ ERROR:`, error.message);
            console.log('Full error:', error);
        }
    }
}

testTranscript().then(() => console.log('\n✅ Test complete'));
