// const AWS = require('aws-sdk');
// const s3 = new AWS.S3({
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: AWS_SECRET_ACCESS_KEY
// })

// const uploadAudio = (filename, BUCKET_NAME, file) => {

//     return new Promise((resolve, reject) => {
//         const params = {
//             Key: '',
//             Bucket: BUCKET_NAME,
//             Body: '',
//             ContentType: 'audio/mpeg',
//             ACL: 'public-read'
//         }

//         s3.upload(params, (err, data) => {
//             if (err) {
//                 reject(err)
//             } else {
//                 resolve(data.Location)
//             }
//         })
//     })
// }

// module.exports = uploadAudio


// Set the region 
// AWS.config.update({region: 'us-east-1'});

// // Create S3 service object
// var s3 = new AWS.S3({apiVersion: '2006-03-01'});

// // call S3 to retrieve upload file to specified bucket
// var uploadParams = {Bucket: 'jetsetradio', Key: '', Body: ''};
// var file = 'today.mp3'

// // Configure the file stream and obtain the upload parameters
// var fileStream = fs.createReadStream(file);
// fileStream.on('error', function(err) {
//   console.log('File Error', err);
// });
// uploadParams.Body = fileStream;
// uploadParams.Key = path.basename(file);

// // call S3 to retrieve upload file to specified bucket
// s3.upload (uploadParams, function (err, data) {
//   if (err) {
//     console.log("Error", err);
//   } if (data) {
//     console.log("Upload Success", data.Location);
//   }
// });