#!/usr/bin/env rspec


ENV['RACK_ENV'] = 'test'

$LOAD_PATH << "lib"

require "signalreports"
require "rspec"
require "rack/test"

def create_entry(data={})
	SignalReports::Entry.insert({
		:callsign  => Array.new(5).map {|i| ("A".."Z").to_a.sample }.join,
		:frequency => '7.0010',
		:mode      => 'CW',
		:datetime  => Time.now.to_i,
		:ur_rst    => '599',
		:my_rst    => '599',
		:name      => 'FOO',
		:address   => 'Kyoto, Japan',
		:memo      => '',
	}.merge(data))
end

describe "SignalReports API" do
	include Rack::Test::Methods
	def app; SignalReports; end

	before do
		SignalReports::DB.run "DELETE FROM entries"
	end

	describe "GET /api/entries" do
		it "returns entries" do
			get "/api/entries"
			expect(last_response).to be_ok
		end
	end

	describe "POST /api/entries" do
		it "can treat datetime strictly" do
			post "/api/entries", {
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

			entry = SignalReports::Entry[data["entry"]["id"]]
			expect(entry).to be_a_kind_of(SignalReports::Entry)
		end
	end

	describe "/api/callsign" do
		context "with no matched entries" do
			it "returns fallback area information (ja area)" do
				get "/api/callsign?q=JA1XXX"
				data = JSON.parse(last_response.body)
				expect(data).to eq([
					{
						"country"   => "Japan",
						"area"      => "Tokyo, Kanagawa, Chiba, Saitama, Gumma, Tochigi, Ibaraki, Yamanashi",
						"value"     => "JA1XXX"
					}
				])
			end
			it "returns fallback area information (generic other countries)" do
				get "/api/callsign?q=K0XXX"
				data = JSON.parse(last_response.body)
				expect(data).to eq([
					{
						"country"   => "United States",
						"area"      => "",
						"value"     => "K0XXX"
					}
				])
			end
		end

		context "with already communicated station" do
			before do
				create_entry(:callsign => 'JA1XXX', :name => 'TARO', :address => 'Kyoto, Japan')
				create_entry(:callsign => 'JA1XXX', :name => 'TARO', :address => 'Kyoto, Japan')
				create_entry(:callsign => 'JA1XXX', :name => 'TARO', :address => 'Kyoto, Japan')
			end

			it "returns existing information" do
				get "/api/callsign?q=JA1"
				data = JSON.parse(last_response.body)
				expect(data).to eq([
					{
						"country"   => "Japan",
						"area"      => "Tokyo, Kanagawa, Chiba, Saitama, Gumma, Tochigi, Ibaraki, Yamanashi",
						"name"      => "TARO",
						"address"   => "Kyoto, Japan",
						"count"     => 3,
						"value"     => "JA1XXX"
					},
					{
						"country"   => "Japan",
						"area"      => "Tokyo, Kanagawa, Chiba, Saitama, Gumma, Tochigi, Ibaraki, Yamanashi",
						"value"     => "JA1"
					}
				])
			end
		end
	end

	describe "/api/delete" do
		context "with existing entry" do
			it "can delete entry with id" do
				entry = SignalReports::Entry[create_entry()]

				delete "/api/entries", { "id" => entry.id }
				data = JSON.parse(last_response.body)
				expect(data).to eq({
					"ok" => true,
					"entry" => entry.to_stash
				})

				expect(SignalReports::Entry[entry.id]).to be_nil
			end
		end

		context "with no entry" do
			it "returns error" do
				delete "/api/entries", { "id" => 0 }
				data = JSON.parse(last_response.body)
				expect(data).to eq({
					"ok" => false,
					"entry" => nil
				})
			end
		end
	end
end
