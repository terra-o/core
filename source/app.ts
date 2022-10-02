import express from 'express'
// import axios from 'axios'
import puppeteer from 'puppeteer'

import { Entry, Training } from './entities'

const app = express()

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
    where: where || 'all',
    difficulty: difficulty ? difficulty.split(',') : 'all',
    language: language || 'all',
    entries: [] as Entry[],
    trainings: [] as Training[]
  }

  if (types) {
    // if (types!!.includes('trainings')) {
    //   let languageCode = ''

    //   switch (language) {
    //     case 'english':
    //       languageCode = '6'
    //       break
    //     case 'french':
    //       languageCode = '34'
    //       break
    //     case 'spanish':
    //       languageCode = '5'
    //       break
    //     default:
    //       languageCode = 'All'
    //       break
    //   }

    //   ;(topics as string).split(',').forEach(async (topic) => {
    //     const { data } = await axios.post(
    //       `https://terra-o-training.herokuapp.com/search//${topic}/1/${languageCode}`
    //     )

    //     resources.trainings.push(
    //       data
    //         .map(
    //           (
    //             training: Partial<Training> & {
    //               link: string
    //               trainingType: string
    //             }
    //           ) => {
    //             return {
    //               title: training.title,
    //               image: training.image,
    //               url: training.link,
    //               type: training.trainingType,
    //               level: training.level.toLowerCase(),
    //               topic
    //             }
    //           }
    //         )
    //         .filter((training: Training) => training.level === difficulty)
    //     )
    //   })
    // }

    if (types!!.includes('entries')) {
      const browser = await puppeteer.launch({
        // args: ['--no-sandbox', '--disable-setuid-sandbox']
      })

      const page = await browser.newPage()

      topics.split(',').forEach(async (topic) => {
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

        const esaResourcesDescriptions = Array.from(
          document.querySelectorAll(
            '.esa-resources > div > div.post-info-container > div.entry-summary > p'
          )
        ).map((p) => p.innerHTML)

        for (const image in esaResourcesImages) {
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

        for (const title in esaProjectsTitles) {
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

        for (const image in esaPostsImages) {
          const index = esaPostsImages.indexOf(image)

          resources.entries.push({
            title: esaPostsTitles[index],
            description: esaPostsDescriptions[index],
            url: esaPostsUrls[index],
            image,
            topic
          })
        }
      })

      // await browser.close()
    }

    return response.json(resources)
  }
})

export { app }
