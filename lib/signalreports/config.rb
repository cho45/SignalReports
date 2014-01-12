class SignalReports < Sinatra::Base
	set :static, true
	set :root, Pathname(__FILE__).parent.parent.parent
	set :public_folder, 'static'

	configure :production do
		set :db, "sqlite://#{settings.root + 'data.db'}"
		set :report_per_page, 50
	end

	configure :development do
		set :db, "sqlite://#{settings.root + 'debug.db'}"
		set :report_per_page, 5
	end

	configure :test do
		test_db = "sqlite://#{Dir.tmpdir}/#{$$}-#{(0...5).map{ ('a'..'z').to_a[rand(26)] }.join}.db"
		warn "Using DB: #{test_db}"
		set :db, test_db
		set :report_per_page, 5
		disable :logging
	end
end


