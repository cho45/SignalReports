#!/usr/bin/env rspec


ENV['RACK_ENV'] = 'test'

$LOAD_PATH << "lib"

require "signalreports"
require "rspec"
require "rack/test"

describe "SignalReports API" do
	include Rack::Test::Methods

	def app
		Sinatra::Application
	end

	it "returns entries" do
		get "/api/entries"
		expect(last_response).to be_ok
	end

	it "can treat datetime strictly" do
		post "/api/input", {
			"callsign" => "JXXXXXX",
			"frequency"=> "7.101",
			"mode"     => "CW",
			"date"     => "2013-09-01",
			"time"     => "12:00",
			"tz"       => "-540", ## value from new Date().getTimezoneOffset()
			"ur_rst"   => "599",
			"my_rst"   => "599",
			"name"     => "Foo Bar",
			"address"  => "Kyoto",
			"memo"     => "Memome",
		}

		data = JSON.parse(last_response.body)
		expect(data).to eq({
			"ok" => true,
			"entry" => {
				"id"        => 1,
				"callsign"  => "JXXXXXX",
				"frequency" => 7.101,
				"mode"      => "CW",
				"datetime"  => 1378004400,
				"ur_rst"    => "599",
				"my_rst"    => "599",
				"name"      => "Foo Bar",
				"address"   => "Kyoto",
				"memo"      => "Memome"
			}
		})
	end
end
