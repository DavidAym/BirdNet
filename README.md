# BirdNet

BirdNet is an AI-powered bird species identification web application developed using Express.js and TensorFlow.js. The system can classify bird species from uploaded images and live camera feeds directly in the browser.

## Features

-  Bird species classification
- Real-time camera detection
- Image upload support
- Deep learning model powered by TensorFlow.js
- Express.js web server
- User-friendly web interface

## Technologies Used

- Node.js
- Express.js
- TensorFlow.js
- HTML5
- CSS3
- JavaScript
- EJS

## Installation

Clone the repository:

```bash
git clone https://github.com/DavidAym/BirdNet.git
cd BirdNet
```

Install dependencies:

```bash
npm install
```

Create a `.env` file if required:

```env
API_KEY=your_api_key_here
```

Start the server:

```bash
npm start
```

Open your browser and visit:

```text
http://localhost:3000
```

## Project Structure

```text
BirdNet/
├── public/
├── views/
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

## Dataset

The bird classification model was trained using a bird image dataset. The dataset is not included in this repository due to size limitations.

## Future Improvements

- Support for more bird species
- Improved classification accuracy
- Mobile-friendly interface
- Bird information and facts
- User accounts and history

## Author

David Habib
