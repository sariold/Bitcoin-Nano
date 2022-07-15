import DOM from "./dom";
import Contract from "./contract";
import "./flightsurety.css";
import web3 from "web3";

(async () => {
	let result = null;

	let contract = new Contract("localhost", () => {
		// Read transaction
		contract.isOperational((error, result) => {
			display("", "", [
				{ label: "Operational status:", error: error, value: result },
			]);
			DOM.elid("address").textContent = contract.firstAirline;
		});
		let flight = DOM.elid("flight").value;
		contract.isPassengerInsured(flight, (error, result) => {
			let string = "You are not currently insured!";
			if (result === true) {
				string = "You are currently insured!";
			}
			DOM.elid("insured-status").textContent = string;
		});
		contract.getPassengerCredits((error, result) => {
			DOM.elid("credit-status").textContent =
				"You have " +
				web3.utils.fromWei(result, "ether") +
				" ether available";
		});

		DOM.elid("refresh").addEventListener("click", () => {
			let flight = DOM.elid("flight").value;
			// Write transaction
			contract.isPassengerInsured(flight, (error, result) => {
				let string = "You are not currently insured!";
				if (result === true) {
					string = "You are currently insured!";
				}
				DOM.elid("insured-status").textContent = string;
			});
			contract.getPassengerCredits((error, result) => {
				DOM.elid("credit-status").textContent =
					"You have " +
					web3.utils.fromWei(result, "ether") +
					" ether available";
			});
		});

		// User-submitted transaction
		DOM.elid("submit-oracle").addEventListener("click", () => {
			let flight = DOM.elid("flight").value;
			// Write transaction
			contract.fetchFlightStatus(flight, (error, result) => {
				display("Oracles", "Fetch Flight Status", [
					{
						label: "Status",
						error: error,
						value: result.flight + ", " + result.timestamp,
					},
				]);
			});
			contract.isPassengerInsured(flight, (error, result) => {
				let string = "You are not currently insured!";
				if (result === true) {
					string = "You are currently insured!";
				}
				DOM.elid("insured-status").textContent = string;
			});
			contract.getPassengerCredits((error, result) => {
				DOM.elid("credit-status").textContent =
					"You have " +
					web3.utils.fromWei(result, "ether") +
					" ether available";
			});
		});

		DOM.elid("buy").addEventListener("click", () => {
			let flightList = document.getElementById("flight");
			let flight = flightList.options[flightList.selectedIndex].value;
			let deposit = DOM.elid("deposit").value;
			contract.buyInsurance(flight, deposit, (error, result) => {
				display("Passenger", "Buy Insurance for Flight", [
					{ label: "Transaction", error: error, value: result },
				]);
			});
		});

		DOM.elid("withdraw").addEventListener("click", () => {
			contract.withdrawCredits((error, result) => {
				display("Passenger", "Withdraw credits from claim", [
					{ label: "Transaction", error: error, value: result },
				]);
			});
		});
	});
})();

function display(title, description, results) {
	let displayDiv = DOM.elid("display-wrapper");
	let resultsDiv = DOM.elid("results-wrapper");
	let section = DOM.section();
	section.appendChild(DOM.h2(title));
	section.appendChild(DOM.h5(description));
	results.map((result) => {
		let row = section.appendChild(DOM.div({ className: "row" }));
		row.appendChild(DOM.div({ className: "col-sm-2 field" }, result.label));
		row.appendChild(
			DOM.div(
				{ className: "col-sm-10 field-value" },
				result.error ? String(result.error) : String(result.value)
			)
		);
		section.appendChild(row);
	});

	if (results[0].label === "Operational status:") {
		displayDiv.append(section);
	} else {
		resultsDiv.innerHTML = "";
		resultsDiv.append(section);
	}
}
