import scrapy
import json
import copy
from functools import partial

class BlogSpider(scrapy.Spider):
    name = 'blogspider'
    start = 0
    maxid = 41750 #11389

    #https://runsignup.com/race/results/?raceId=41000
    #'
    start_urls = map(lambda n: 'https://runsignup.com/race/results/?raceId=' + str(n) + '', range(start, maxid))

    def parse(self, response, race=None):
        data = {
            'race': {},
            'results': [],
            'url': response.url
        }
        data['race']['name'] = ' '.join(response.css('.runnerUITitle ::text').extract()).strip()
        data['race']['date'] = response.css('.runnerUISubHeading ::text').extract_first()
        data['race']['location'] = ' '.join(response.css('[itemprop="address"] ::text').extract()).strip()
        data['race']['type'] = response.css('.runnerUIPrimaryDetails > span:nth-child(6) ::text').extract_first()
        data['race']['image'] = response.css('.runnerUILogo').xpath('.//img/@src').extract_first()

        count = 0
        raceid = response.url.split('=')[1]
        if 'resultSet' not in response.url: #base page
            for link in response.css('a[href^="/race/results/"]'):
                subid = link.xpath('@data-value').extract_first()
                year = link.xpath('@data-year').extract()[0]
                data['race'] = copy.copy(data['race'])
                data['race']['year'] = year
                if year and subid:
                    count += 1
                    print subid, year
                    url = 'https://runsignup.com/race/results/?raceId='+str(raceid)+'&resultSetId-'+str(subid)+'&resultSetId='+str(subid)+'&mobile=T&page=1&num=20000&last_name=&first_name=&bib_num=&city=&gender=&countrycode=&state='
                    yield scrapy.Request(url, headers={'Accept':'application/json'}, callback=partial(self.parse, race=data['race']))
            if count == 0 and data['race']['name'] and data['race']['date']:
                yield data

        else:
            data['race'] = race
            data['race']['bad_date'] = data['race']['year'] not in data['race']['date']
            d = json.loads(response.text)
            headers = list(map(lambda h: h['name'], d['headings']))
            for r in d['resultSet']['results']:
                data['results'].append(dict(zip(headers, r)))
            yield data
