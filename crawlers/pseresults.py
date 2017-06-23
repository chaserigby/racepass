import scrapy

class BlogSpider(scrapy.Spider):
    name = 'blogspider'
    start = 0
    maxid = 900
    #'
    start_urls = map(lambda n: 'http://www.pseresults.com/events/' + str(n) + '/results/', range(start, maxid))

    def parse(self, response):
        data = {
            'race': {},
            'results': [],
            'url': response.url
        }
        
        if 'name' not in response.url: #base page
            for option in response.css('#result_selector').xpath('.//option/@value'):
                subid = option.extract()
                if subid:
                    yield scrapy.Request(response.urljoin(str(subid) + '/?c0=&c1=&name=&bib=&sort%5B%5D=10&sort%5B%5D=11&sort%5B%5D=2&sort%5B%5D=1&page=1&per_page=20000'), callback=self.parse)
        else:
            data['race']['name'] = response.css('h2 ::text').extract_first()
            data['race']['date'] = response.css('.event_date_location p:first-child ::text').extract()[1]
            data['race']['location'] = response.css('.event_date_location p:nth-child(2) ::text').extract()[1]
            data['race']['source'] = response.css('.event_date_location p:nth-child(3)').xpath('.//a/@href').extract_first()
            data['race']['type'] = response.css('h2:nth-child(2) ::text').extract_first()
            data['race']['image'] = response.css('.logo_image_top_right').xpath('@src').extract_first()

            print data
            #break;
            headers = []
            for th in response.css('table tr th'):
                h = ''.join(th.xpath('.//text()').extract()).strip()
                headers.append(h)
            for row in response.css('table tr'):
                racer = {}
                for i, td in enumerate(row.css('td')):
                    value = ''.join(td.css('::text').extract()).strip()
                    racer[headers[i]] = value
                data['results'].append(racer)
            yield data
