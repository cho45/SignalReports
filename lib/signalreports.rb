require "rubygems"
require "sinatra/base"
require "sass"
require "json"
require "pathname"

require "signalreports/config"
require "signalreports/db"
require "signalreports/callsign"

class SignalReports < Sinatra::Base
	class APIError < Exception; end
	class EntryNotFoundError < APIError; end

	error APIError do
		content_type :json
		{
			"ok" => false,
			"error" => env['sinatra.error'].name
		}
	end

	get "/" do
		erb :index
	end

	get "/styles.css" do
		scss :styles
	end

	post "/api/entries" do
		entry_id = request["id"]

		date = /^(?<year>\d{4})-(?<month>\d\d)-(?<day>\d\d)$/.match(request["date"])
		time = /^(?<hour>\d\d):(?<minute>\d\d)(?::(?<second>\d\d))?$/.match(request["time"])
		offset = request["tz"].to_i * 60
		datetime = Time.utc(date[:year], date[:month], date[:day], time[:hour], time[:minute], time[:second] || 0) + offset

		data = {
			:callsign  => request["callsign"],
			:frequency => request["frequency"],
			:mode      => request["mode"],
			:datetime  => datetime.to_i,
			:ur_rst    => request["ur_rst"],
			:my_rst    => request["my_rst"],
			:name      => request["name"],
			:address   => request["address"],
			:memo      => request["memo"],
		}

		entry = nil

		if !entry_id || entry_id.empty?
			DB.transaction do
				entry = Entry.create(data)
			end
		else
			DB.transaction do
				entry = Entry[entry_id] or raise EntryNotFoundError
				entry.update(data)
			end
		end

		content_type :json
		{ "ok" => true, "entry" => entry.to_stash }.to_json
	end

	get "/api/entries" do
		data = Entry

		if request["query"]
			data = data.where(Sequel.join([:callsign, :frequency, :mode, :name, :address, :memo]).like("%#{request["query"]}%", :case_insensitive => true))
		end

		if request["before"]
			before = request["before"].to_i
			data = data.where('id < ?', before)
		end

		entries = data.order(Sequel.desc(:datetime)).limit(100).all

		content_type :json
		{
			"ok" => true,
			"entries" =>  entries.map {|i|
				i.to_stash
			}
		}.to_json
	end

	delete "/api/entries" do
		entry = Entry.where('id = ?', request["id"].to_i).first

		content_type :json
		if entry
			entry.delete
			{
				"ok" => true,
				"entry" => entry.to_stash
			}.to_json
		else
			{
				"ok" => false,
				"entry" => nil,
			}.to_json
		end
	end

	get "/api/callsign" do
		callsign = request['q'].upcase
		data = []

		matched = SignalReports::CALLSIGN_INFO.find {|(re,_,_)| re.match(callsign) }
		data << {
			"country" => matched[1],
			"area"    => matched[2],
			"value"   => callsign
		} if matched

		DB["SELECT *, COUNT(*) as count FROM entries WHERE callsign LIKE ? GROUP BY callsign ORDER BY datetime DESC LIMIT 10", "#{callsign}%"].each do |entry|
			data.push({
				"country" => matched ? matched[1] : "",
				"area"    => matched ? matched[2] : "",
				"name"    => entry[:name],
				"address" => entry[:address],
				"count"   => entry[:count],
				"value"   => entry[:callsign],
			})
		end

		content_type :json
		data.reverse.to_json
	end


end
