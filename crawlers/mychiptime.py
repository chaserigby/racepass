import scrapy

class MyChipTime(scrapy.Spider):
    name = 'blogspider'
    maxid = 10420
    start_urls = list(map(lambda n: 'http://mychiptime.com/searchevent.php?id=' + str(n), range(maxid, maxid))) + \
        list(map(lambda n: 'http://mychiptime.com/searchResultGen.php?showExtra=1&showall=1&eID=' + str(n), range(6308, maxid)))
    #start_urls = ['http://www.novatimingsystems.com/results.aspx?race_id=9004']

    def parse(self, response):
        data = {
            'race': {},
            'results': [],
            'url': response.url,
            'id': response.url.split('=').pop()
        }

        if 'searchevent' in data['url']:
            data['race']['type'] = response.css('h1 ::text')[0].extract()
            data['race']['type2'] = response.css('h4 ::text')[0].extract().split('\n')[0]
            data['race']['date'] = response.css('h1 ::text')[1].extract()
            data['race']['location'] = response.css('h1 ::text')[2].extract()
            data['race']['name'] = response.css('h3 a ::text').extract_first()
            data['race']['img'] = response.css('.three').xpath('.//img/@src').extract_first()
            data['race']['source'] = response.css('.six p').xpath('.//a/@href')[1].extract()
            yield data

        if 'searchResultGen' in data['url']:
            headers = []
            for th in response.css('table tr th'):
                h = ''.join(th.xpath('.//text()').extract()).strip()
                headers.append(h)
            for row in response.css('table tr'):
                racer = {}
                for i, td in enumerate(row.css('td')):
                    value = ''.join(td.xpath('.//text()').extract()).strip()
                    racer[headers[i]] = value
                data['results'].append(racer)
            yield data

