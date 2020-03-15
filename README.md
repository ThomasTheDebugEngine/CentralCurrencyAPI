# CentralCurrencyAPI
a central API for currency exchange rates that can dynamically be configured to get requests from any other APIs 


this API is meant to be a universal currency API that can be configured to utilize and unify any other API to get the most complete and up to date currency rates

# IMPORTANT:  mongoDB required

this project is built around mongoDB as its primary caching mechanism the goal of this mechanism is to be able to sustain daily exchange rates with only 1 request to any API per day

note for windows users: a ps1 file for autoconfig is included from :https://github.com/ThomasTheDebugEngine/MongoDB-AutoconfigWin
check that out for automated setup of the database for windows
