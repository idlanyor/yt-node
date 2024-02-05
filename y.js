const express = require('express');
const youtubedl = require('youtube-dl-exec');
const cors = require('cors');
const chalk = require('chalk');

const app = express();
const PORT = process.env.PORT || 3000; // Menggunakan PORT yang disediakan oleh lingkungan Vercel atau default ke 3000

// Fungsi untuk mendapatkan URL unduh dari permintaan saat ini
function getDownloadUrl(req, path) {
    const host = req.headers.host;
    return `https://${host}/${path}`;
}

// Setup middleware
app.use(cors());
app.set('json spaces', 2);

app.get("/", (req, res) => {
    const endpoints = {
        "/": "Daftar endpoint yang tersedia",
        "/video": "Endpoint untuk mengunduh video dari YouTube",
        "/audio": "Endpoint untuk mengunduh audio dari YouTube"
    };

    res.json(endpoints);
});

// Endpoint untuk mengunduh video dari YouTube
app.get('/api/video', async (req, res) => { // Menyesuaikan endpoint menjadi /api/video
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL tidak ditemukan.' });
    }

    try {
        const video = await youtubedl(url,
            {
                dumpSingleJson: true,
                noCheckCertificates: true,
                noWarnings: true,
                preferFreeFormats: true,
                addHeader: [
                    'referer:youtube.com',
                    'user_agent:googlebot'
                ]

            })
        const downloadLink = getDownloadUrl(req, 'api/video-download?url=' + encodeURIComponent(url)); // Menyesuaikan path untuk link unduh

        const responseData = {
            title: video.title,
            thumbnail: video.thumbnail,
            duration: video.duration,
            formats: video.formats,
            downloadLink: downloadLink
        };

        res.json(responseData);
    } catch (error) {
        console.error('Gagal mengunduh video:', error);
        res.status(500).json({ error: 'Terjadi kesalahan saat mengunduh video.'+error });
    }
});

// Endpoint untuk mengunduh audio dari YouTube
app.get('/api/audio', async (req, res) => { // Menyesuaikan endpoint menjadi /api/audio
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL tidak ditemukan.' });
    }

    try {
        const audio = await youtubedl(url, { dumpJson: true, noWarnings: true, extractAudio: true, audioFormat: 'mp3' });
        const downloadLink = getDownloadUrl(req, 'api/audio-download?url=' + encodeURIComponent(url)); // Menyesuaikan path untuk link unduh

        const responseData = {
            title: audio.title,
            thumbnail: audio.thumbnail,
            duration: audio.duration,
            downloadLink: downloadLink
        };

        res.json(responseData);
    } catch (error) {
        console.error('Gagal mengunduh audio:', error);
        res.status(500).json({ error: 'Terjadi kesalahan saat mengunduh audio.' });
    }
});

// Endpoint untuk mengunduh video
app.get('/api/video-download', async (req, res) => { // Menyesuaikan endpoint menjadi /api/video-download
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL tidak ditemukan.' });
    }

    try {
        const video = await youtubedl(url, { output: '%(title)s.%(ext)s' });
        res.set('Content-Disposition', `attachment; filename="${video.title}.mp4"`);
        res.set('Content-Type', 'video/mp4');
        console.log(res)
        video.pipe(res);
    } catch (error) {
        console.error('Gagal mengunduh video:', error);
        res.status(500).json({ error: 'Terjadi kesalahan saat mengunduh video.' });
    }
});

// Endpoint untuk mengunduh audio
app.get('/api/audio-download', async (req, res) => { // Menyesuaikan endpoint menjadi /api/audio-download
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL tidak ditemukan.' });
    }

    try {
        const audio = await youtubedl(url, { output: '%(title)s.%(ext)s', noWarnings: true, extractAudio: true, audioFormat: 'mp3' });
        res.set('Content-Disposition', `attachment; filename="${audio.title}.mp3"`);
        res.set('Content-Type', 'audio/mp3');
        audio.pipe(res);
    } catch (error) {
        console.error('Gagal mengunduh audio:', error);
        res.status(500).json({ error: 'Terjadi kesalahan saat mengunduh audio.' });
    }
});

// Menjalankan server
app.listen(PORT, () => {
    console.log(chalk.blue.bold(`App now running on port ${chalk.yellow(PORT)}, yeayyð`));
});
