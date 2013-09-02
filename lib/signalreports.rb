require "rubygems"
require "sinatra/base"
require "sass"
require "json"
require "pathname"

class SignalReports < Sinatra::Base
	set :static, true
	set :root, Pathname(__FILE__).parent.parent
	set :public_folder, 'static'

	configure :production do
		set :db, "sqlite://#{settings.root + 'data.db'}"
	end

	configure :development do
		set :db, "sqlite://#{settings.root + 'debug.db'}"
	end

	configure :test do
		test_db = "sqlite://#{Dir.tmpdir}/#{$$}-#{(0...5).map{ ('a'..'z').to_a[rand(26)] }.join}.db"
		warn "Using DB: #{test_db}"
		set :db, test_db
	end

	require "signalreports/callsign"
	require "signalreports/db"

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

	get "/api/callsign" do
		## TODO: 過去に交信したことあるリストから探し、存在しなければフォールバックするように
		callsign = request['q'].upcase

		matched = SignalReports::CALLSIGN_INFO.find {|(re,_,_)| re.match(callsign) }

		content_type :json
		if matched
			[
				{
					"country" => matched[1],
					"area"    => matched[2],
					"value"   => callsign
				}
			].to_json
		else
			[].to_json
		end
	end

	get "/styles.css" do
		scss :styles
	end

	post "/api/input" do
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
			entry_id = Entry.insert(data)
			entry = Entry[entry_id]
		else
			entry = Entry[entry_id] or raise EntryNotFoundError
			entry.update(data)
		end

		content_type :json
		{ "ok" => true, "entry" => entry.to_stash }.to_json
	end

	get "/api/entries" do
		if request["before"].nil?
			entries = Entry.order(Sequel.desc(:datetime)).limit(100).all
		else
			before = request["before"].to_i
			entries = Entry.where('id < ?', before).order(Sequel.desc(:datetime)).limit(100).all
		end

		content_type :json
		{
			"ok" => true,
			"entries" =>  entries.map {|i|
				i.to_stash
			}
		}.to_json
	end


end
