const express = require('express')
const app = express()
app.use(express.json())

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
let db = null

const path = require('path')
const dbpath = path.join(__dirname, 'userData.db')

const bcrypt = require('bcrypt')

const connectionWithServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000')
    })
  } catch (e) {
    console.log(`The Error Message is ${e}`)
    process.exit(1)
  }
}
connectionWithServer()

//API 1

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const checkingUser = `SELECT * FROM user WHERE username='${username}' `
  const res = await db.get(checkingUser)

  if (res === undefined) {
    if (password.length < 5) {
      response.status = 400
      response.send('Password is too short')
    } else {
      const hashedPassword = await bcrypt.hash(password, 10)
      const instUserDetails = `
            INSERT INTO user(
                username,name,password,gender,location
            )
            VALUES('${username}','${name}','${hashedPassword}','${gender}','${location}');
          `
      const insRes = await db.run(instUserDetails)
      response.status = 200
      response.send('User created successfully')
    }
  } else {
    response.status = 400
    response.send('User already exists')
  }
})

//API 2

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const loginTest = `SELECT * FROM user WHERE username LIKE '${username}'`
  const loginTestRes = await db.get(loginTest)
  if (loginTestRes !== undefined) {
    const comparePassword = await bcrypt.compare(
      password,
      loginTestRes.password,
    )
    if (comparePassword === true) {
      response.status = 200
      response.send('Login success!')
    } else {
      response.status = 400
      response.send('Invalid password')
    }
  } else {
    response.status = 400
    response.send('Invalid user')
  }
})

//API 3

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const test = `SELECT * FROM user WHERE username LIKE '${username}'`
  const testRes = await db.get(test)

  if (testRes !== undefined) {
    const comparePassword = await bcrypt.compare(oldPassword, testRes.password)
    if (comparePassword === true) {
      if (newPassword.length < 5) {
        response.status = 400
        response.send('Password is too short')
      } else {
        const hashPassword = await bcrypt.hash(newPassword, 10)
        const UpdQueryTable = `
           UPDATE user SET password='${hashPassword}'
           WHERE username='${username}';
          `
        const resQuery = await db.run(UpdQueryTable)
        response.status = 200
        response.send('Password updated')
      }
    } else{
      response.status = 400
      response.send('Invalid current password')
    }
  }
})

module.exports=app;

