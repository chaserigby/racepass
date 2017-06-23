## Race Website Scrapy Crawlers

The quality of these vary a lot and some may no longer work, but they are useful for reference. The most important crawler here is race-find.py since that's our primary data source now.

## How to run

1. [Install Scrapy](https://doc.scrapy.org/en/latest/intro/install.html) (with Python 3)
2. scrapy runspider race-find.py -o data/race-find.csv

Note that the column order of the CSV output seems pretty random.