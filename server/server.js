const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 9661;

// MySQL Connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cakraindo_history'
});

// Connect to MySQL
connection.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL: ', err);
        return;
    }
    console.log('Connected to MySQL');
});

app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

app.use(express.static('public'));

app.get('/6c2a5621e0170d2', (req, res) => {
    // Send the index.html file as the response
    res.sendFile(path.join(__dirname, './', 'checkgps.html'));
});

// Route to get all books
app.get('/api/data1', (req, res) => {
    const query = 
            `
            SELECT DISTINCT
                JO.no_po_customer, 
                VHS.VName, 
                VHS.Latitude, 
                VHS.Longitude, 
                VHS.Direct, 
                CAST(VHS.InRoute AS UNSIGNED) InRoute, 
                CAST(VHS.InGarage AS UNSIGNED) InGarage, 
                CAST(VHS.InDestination AS UNSIGNED) InDestination, 
                CAST(VHS.Timeout AS UNSIGNED) Timeout,
                DATE_FORMAT(MND.Assigntodriver, '%d %b %Y %H:%i:%s') Assigntodriver,
                DATE_FORMAT(MND.TerimaJob, '%d %b %Y %H:%i:%s') TerimaJob,
                DATE_FORMAT(MND.Pengambilan, '%d %b %Y %H:%i:%s') Pengambilan,
                DATE_FORMAT(MND.TibadilokasiPengambilan, '%d %b %Y %H:%i:%s') TibadilokasiPengambilan,
                DATE_FORMAT(MND.Berangkat, '%d %b %Y %H:%i:%s') Berangkat,
                DATE_FORMAT(MND.Tibadilokasimuat, '%d %b %Y %H:%i:%s') Tibadilokasimuat,
                DATE_FORMAT(MS.MuatBarang, '%d %b %Y %H:%i:%s') MuatBarang,
                DATE_FORMAT(MS.BongkarMuatan, '%d %b %Y %H:%i:%s') BongkarMuatan,
                DATE_FORMAT(MS.SelesaiBongkar, '%d %b %Y %H:%i:%s') SelesaiBongkar,
                DATE_FORMAT(MS.Selesai, '%d %b %Y %H:%i:%s') Selesai,
                CASE VC.company_id WHEN 1 THEN 'MDN' WHEN 2 THEN 'JKT' WHEN 3 THEN 'SBY' ELSE 'KLM' END City
            FROM 
                cakraindodev.job_orders JO 
                LEFT JOIN cakraindodev.job_order_details JOD ON JO.id = JOD.header_id 
                LEFT JOIN cakraindodev.manifest_details MN ON MN.job_order_detail_id = JOD.id 
                LEFT JOIN cakraindodev.delivery_manifests DM ON DM.manifest_id = MN.header_id 
                LEFT JOIN (
						SELECT MSL.manifest_id,
						MAX(CASE ALS.TypeDescription WHEN 'Muat Barang' THEN MSL.created_at END) MuatBarang,
						MAX(CASE ALS.TypeDescription WHEN 'Bongkar Muatan' THEN MSL.created_at END) BongkarMuatan,
						MAX(CASE ALS.TypeDescription WHEN 'Selesai Bongkar' THEN MSL.created_at END) SelesaiBongkar,
						MAX(CASE ALS.TypeDescription WHEN 'Selesai' THEN MSL.created_at END) Selesai
						FROM cakraindodev.manifest_status_logs MSL
						LEFT JOIN cakraindodev.all_status ALS ON MSL.job_status_id = ALS.DetailTypeID
						GROUP BY MSL.manifest_id 
					 ) MS ON MS.manifest_id = MN.header_id
					 LEFT JOIN(
					 SELECT DMN.manifest_id,
						MAX(CASE ST.TypeDescription WHEN 'Assigned To Driver' THEN DOS.created_at END) Assigntodriver,
						MAX(CASE ST.TypeDescription WHEN 'Terima Job' THEN DOS.created_at END) TerimaJob,
						MAX(CASE ST.TypeDescription WHEN 'Pengambilan' THEN DOS.created_at END) Pengambilan,
						MAX(CASE ST.TypeDescription WHEN 'Tiba dilokasi Pengambilan' THEN DOS.created_at END) TibadilokasiPengambilan,
						MAX(CASE ST.TypeDescription WHEN 'Berangkat' THEN DOS.created_at END) Berangkat,
						MAX(CASE ST.TypeDescription WHEN 'Tiba dilokasi' THEN DOS.created_at END) Tibadilokasimuat
						FROM cakraindodev.delivery_manifests DMN 
						LEFT JOIN cakraindodev.delivery_order_status_logs DOS ON DOS.delivery_order_driver_id = DMN.delivery_order_driver_id 
						LEFT JOIN cakraindodev.all_status ST ON ST.DetailTypeID = DOS.job_status_id 
						GROUP BY DMN.manifest_id
					 ) MND ON MND.manifest_id = MN.header_id
					 LEFT JOIN cakraindodev.vehicles VC ON VC.delivery_id = DM.delivery_order_driver_id 
                RIGHT JOIN (
                    SELECT 
                        GH.VName, 
                        GH.Latitude, 
                        GH.Longitude, 
                        GH.Direct, 
                        GH.InRoute, 
                        GH.InGarage, 
                        GH.InDestination, 
                        GH.Timeout 
                    FROM 
                        cakraindo_history.GEO_History GH 
                        JOIN (
                            SELECT 
                                MAX(GH.ID) ID, 
                                GH.VName 
                            FROM 
                                cakraindo_history.GEO_History GH 
                            GROUP BY 
                                VName
                        ) VHC ON VHC.ID = GH.ID
                ) VHS ON VHS.VName = VC.NOPOL AND VC.NOPOL IS NOT NULL 
                WHERE VC.company_id = 1 
            `;

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error getting books: ', err);
            res.status(500).json({ error: 'Error getting books from database' });
            return;
        }
        res.json(results);
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
