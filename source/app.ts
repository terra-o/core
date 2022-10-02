import express from 'express'
import cors from 'cors'
import timeout from 'connect-timeout'
import puppeteer from 'puppeteer'

import { Entry, Training } from './entities'

const app = express()

app.use(express.json())
app.use(
  cors({
    origin: ['http://localhost:3000', 'https://terra-o.vercel.app']
  })
)
app.use(timeout('3600s'))

app.get('/', (request, response) => {
  return response.json({ terra: 'o' })
})

app.get('/resources', async (request, response) => {
  const {
    query: { types, topics, where, difficulty, language }
  }: {
    query: {
      types?: string
      topics?: string
      where?: string
      difficulty?: string
      language?: string
    }
  } = request

  if (!types || !topics)
    return response
      .status(400)
      .json({ error: 'Missing query required parameters: [types, topics]' })

  const resources = {
    types: types.split(','),
    topics: topics.split(','),
    where: where || 'online',
    difficulty: difficulty ? difficulty.split(',') : 'all',
    language: language || 'english',
    entries: [] as Entry[],
    trainings: [] as Training[]
  }

  if (types) {
    if (types!!.includes('trainings')) {
      let languageCode = 'All'

      switch (language) {
        case 'english':
          languageCode = '6'
          break
        case 'french':
          languageCode = '34'
          break
        case 'spanish':
          languageCode = '5'
          break
      }

      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })

      const page = await browser.newPage()

      for (const topic of topics.split(',')) {
        let topicCode = 'All'

        switch (topic) {
          case 'applied sciences':
            topicCode = '138'
            break
          case 'urban development':
            topicCode = '348'
            break
          case 'develop':
            topicCode = '153'
            break
          case 'wildfires':
            topicCode = '152'
            break
          case 'climate':
            topicCode = '147'
            break
          case 'risk & resilience':
            topicCode = '143'
            break
          case 'sdg':
            topicCode = '149'
            break
          case 'socioeconomic assessments':
            topicCode = '151'
            break
          case 'valuables':
            topicCode = '150'
            break
          case 'capacity building':
            topicCode = '13'
            break
          case 'disasters':
            topicCode = '14'
            break
          case 'ecological forecasting':
            topicCode = '15'
            break
          case 'agriculture':
            topicCode = '16'
            break
          case 'health & air quality':
            topicCode = '17'
            break
          case 'water resources':
            topicCode = '18'
            break
          case 'group on earth observations':
            topicCode = '105'
            break
          case 'prizes & challenges':
            topicCode = '141'
            break
        }

        await page.goto(
          `https://appliedsciences.nasa.gov/join-mission/training?program_area=${topicCode}&languages=${languageCode}&source=All`
        )

        const trainings = (await page.evaluate(
          (where, difficulty) => {
            const list = Array.from(
              document.querySelectorAll('.ds-list.layout-wrapper')
            )

            return list
              .map((item: any) => {
                const type = item
                  .querySelector('.field--name-field-training-type a')
                  .innerText.toLowerCase()
                  .split(' ')[0]

                if (type === 'online' && where === 'in-person') return null

                const level = item
                  .querySelector(
                    'div.field.field--name-field-level.field--type-entity-reference.field--label-inline.clearfix > div.field__item'
                  )
                  .innerText.toLowerCase()

                if (level !== difficulty) return null

                return {
                  title: item.querySelector('.field--name-node-title h2 a')
                    .innerText,
                  url: item.querySelector('.field--name-node-title h2 a').href,
                  image: item.querySelector(
                    '.field--name-field-featured-image img'
                  ).src,
                  type,
                  level,
                  date: item.querySelector(
                    'div.field.field--name-field-start-and-end-date.field--type-daterange.field--label-inline.clearfix > div.field__item'
                  ).innerText
                }
              })
              .filter((item: any) => item !== null)
          },
          where,
          difficulty
        )) as Training[]

        resources.trainings.push(...trainings)
      }
    }

    if (types!!.includes('entries')) {
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })

      const page = await browser.newPage()

      for (const topic of topics.split(',')) {
        await page.goto('https://eo4society.esa.int/search/' + topic)

        const esaResourcesImages = await page.evaluate(() => {
          return Array.from(
            document.querySelectorAll(
              '.esa-resources > div > div.post-thumb > a > img'
            )
          ).map((image) => image.getAttribute('src'))
        })

        const esaResourcesTitles = await page.evaluate(() => {
          return Array.from(
            document.querySelectorAll(
              '.esa-resources > div > div > header > h2 > a'
            )
          ).map((a) => a.textContent)
        })

        const esaResourcesUrls = await page.evaluate(() => {
          return Array.from(
            document.querySelectorAll(
              '.esa-resources > div > div > header > h2 > a'
            )
          ).map((a) => a.getAttribute('href'))
        })

        const esaResourcesDescriptions = await page.evaluate(() => {
          return Array.from(
            document.querySelectorAll(
              '.esa-resources > div > div.post-info-container > div.entry-summary > p'
            )
          ).map((p) => p.innerHTML)
        })

        for (const image of esaResourcesImages) {
          const index = esaResourcesImages.indexOf(image)

          resources.entries.push({
            title: esaResourcesTitles[index],
            description: esaResourcesDescriptions[index],
            url: esaResourcesUrls[index],
            image,
            topic
          })
        }

        const esaProjectsTitles = await page.evaluate(() => {
          return Array.from(
            document.querySelectorAll(
              '.esa-projects > div > div > header > h2 > a'
            )
          ).map((a) => a.textContent)
        })

        const esaProjectsUrls = await page.evaluate(() => {
          return Array.from(
            document.querySelectorAll(
              '.esa-projects > div > div > header > h2 > a'
            )
          ).map((a) => a.getAttribute('href'))
        })

        const esaProjectsDescriptions = await page.evaluate(() => {
          return Array.from(
            document.querySelectorAll(
              '.esa-projects > div > div > div.entry-summary > p'
            )
          ).map((p) => p.getAttribute('innerHTML'))
        })

        for (const title of esaProjectsTitles) {
          const index = esaProjectsTitles.indexOf(title)

          resources.entries.push({
            title,
            description: esaProjectsDescriptions[index],
            url: esaProjectsUrls[index],
            image: '',
            topic
          })
        }

        const esaPostsImages = await page.evaluate(() => {
          return Array.from(
            document.querySelectorAll('.post > div > div.post-thumb > a > img')
          ).map((image) => image.getAttribute('src'))
        })

        const esaPostsTitles = await page.evaluate(() => {
          return Array.from(
            document.querySelectorAll('.post > header > h2 > a')
          ).map((a) => a.textContent)
        })

        const esaPostsUrls = await page.evaluate(() => {
          return Array.from(
            document.querySelectorAll('.post > header > h2 > a')
          ).map((a) => a.getAttribute('href'))
        })

        const esaPostsDescriptions = await page.evaluate(() => {
          return Array.from(
            document.querySelectorAll('.post > div > div.entry-summary > p')
          ).map((p) => p.getAttribute('innerHTML'))
        })

        for (const image of esaPostsImages) {
          const index = esaPostsImages.indexOf(image)

          if (!esaPostsTitles[index] || !esaPostsUrls[index]) continue

          resources.entries.push({
            title: esaPostsTitles[index],
            description: esaPostsDescriptions[index],
            url: esaPostsUrls[index],
            image,
            topic
          })
        }
      }

      await browser.close()
    }
  }

  return response.json(resources)
})

export { app }
