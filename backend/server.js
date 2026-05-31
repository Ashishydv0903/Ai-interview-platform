const express = require("express");
const cors = require("cors");

const resumeRoutes = require("./routes/resumeRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/resume", resumeRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Backend running",
  });
});

app.listen(5000, () => {
  console.log("Server started on port 5000");
});